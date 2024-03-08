import SystemError from '@core/systemError'
import * as PromiseUtils from '@core/promiseUtils'
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
    if (filesSummaries?.length > 0) {
      const filesUuids = filesSummaries.map(RecordFile.getUuid)

      await this.checkFileUuidsAreValid(filesUuids)

      await this.checkFilesNotExceedingAvailableQuota(filesSummaries)

      this.total = filesSummaries.length
      await PromiseUtils.each(filesSummaries, async (fileSummary) => {
        let file = { ...fileSummary }
        // load file content from a separate file
        const fileUuid = RecordFile.getUuid(fileSummary)
        const fileContent = await ArenaSurveyFileZip.getFile(arenaSurveyFileZip, fileUuid)
        if (!fileContent) {
          const fileName = RecordFile.getName(fileSummary)
          throw new Error(`Missing content for file ${fileUuid} (${fileName})`)
        }

        this.checkFileUuidIsInRecords(fileUuid)

        file = RecordFile.assocContent(fileContent)(file)

        await this.persistFile(file)

        this.incrementProcessedItems()
      })
    } else {
      this.logInfo('no files found')
    }
  }

  checkFileUuidIsInRecords(fileUuid) {
    const { recordsFileUuids } = this.context
    if (recordsFileUuids && !recordsFileUuids.includes(fileUuid)) {
      throw new Error(`File UUID ${fileUuid} not found in records`)
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

  async checkFileUuidsAreValid(filesUuids) {
    const { recordsFileUuids } = this.context

    this.logInfo('file UUIDs in zip file', filesUuids)
    this.logInfo('file UUIDs found in records', recordsFileUuids)

    recordsFileUuids?.forEach((recordFileUuid) => {
      if (!filesUuids.includes(recordFileUuid)) {
        throw new Error(`missing file with UUID ${recordFileUuid}`)
      }
    })
  }
}
