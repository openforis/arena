import { Objects } from '@openforis/arena-core'

import SystemError from '@core/systemError'
import * as RecordFile from '@core/record/recordFile'

import Job from '@server/job/job'
import * as FileService from '@server/modules/record/service/fileService'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

export default class FilesImportJob extends Job {
  constructor(params) {
    super('FilesImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip } = this.context

    const filesSummaries = await ArenaSurveyFileZip.getFilesSummaries(arenaSurveyFileZip)

    await this.checkFileUuidsAreValid(filesSummaries)

    if (filesSummaries?.length > 0) {
      await this.checkFilesNotExceedingAvailableQuota(filesSummaries)

      this.total = filesSummaries.length
      for await (const fileSummary of filesSummaries) {
        let file = { ...fileSummary }
        // load file content from a separate file
        const fileUuid = RecordFile.getUuid(fileSummary)
        const fileContent = await ArenaSurveyFileZip.getFile(arenaSurveyFileZip, fileUuid)
        if (!fileContent) {
          const fileName = RecordFile.getName(fileSummary)
          throw new Error(`Missing content for file ${fileUuid} (${fileName})`)
        }

        file = RecordFile.assocContent(fileContent)(file)

        await this.persistFile(file)

        this.incrementProcessedItems()
      }
    } else {
      this.logInfo('no files found')
    }
  }

  async persistFile(file) {
    const { context, tx } = this
    const { surveyId } = context
    const fileUuid = RecordFile.getUuid(file)
    const fileProps = RecordFile.getProps(file)
    this.logDebug(`persisting file ${fileUuid}`)
    const existingFileSummary = await FileService.fetchFileSummaryByUuid(surveyId, fileUuid, this.tx)
    if (existingFileSummary) {
      this.logDebug(`file already existing`)
      if (RecordFile.isDeleted(existingFileSummary)) {
        this.logDebug(`file previously marked as deleted: delete permanently and insert a new one`)
        await FileService.deleteFileByUuid({ surveyId, fileUuid }, tx)
        await FileService.insertFile(surveyId, file, tx)
      } else {
        this.logDebug('updating props')
        await FileService.updateFileProps(surveyId, fileUuid, fileProps, tx)
      }
    } else {
      this.logDebug(`file not existing: inserting new file`, fileProps)
      await FileService.insertFile(surveyId, file, tx)
    }
  }

  async checkFilesNotExceedingAvailableQuota(filesSummaries) {
    const { surveyId } = this.context
    const filesStatistics = await FileService.fetchFilesStatistics({ surveyId })
    const totalSize = filesSummaries.reduce((tot, fileSummary) => tot + RecordFile.getSize(fileSummary), 0)
    if (totalSize > filesStatistics.availableSpace) {
      throw new SystemError('cannotImportFilesExceedingQuota')
    }
  }

  async checkFileUuidsAreValid(filesSummaries) {
    const { recordsFileUuids } = this.context

    if (Objects.isEmpty(recordsFileUuids)) {
      this.logDebug('no files to restore in the records')
      return
    }
    if (Objects.isEmpty(filesSummaries)) {
      // files data in records but not in the files folder being restored
      throw new Error('missing files summary file')
    }

    const filesUuids = filesSummaries.map(RecordFile.getUuid)
    this.logDebug(`file uuids to be imported: ${filesUuids}`)

    const missingRecordFileUuidsInFiles = recordsFileUuids.filter(
      (recordFileUuid) => !filesUuids.includes(recordFileUuid)
    )
    if (missingRecordFileUuidsInFiles.length > 0) {
      throw new Error(`missing files with UUIDs ${missingRecordFileUuidsInFiles}`)
    }

    // TODO check if it's necessary to check that all files are in the updated records data
    // const missingFileUuids = filesUuids.filter((fileUuid) => !recordsFileUuids.includes(fileUuid))
    // if (missingFileUuids.length > 0) {
    //   throw new Error(`files with UUIDs ${missingFileUuids} not found in records`)
    // }
  }
}
