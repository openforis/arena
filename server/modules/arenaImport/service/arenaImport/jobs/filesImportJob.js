import { Objects } from '@openforis/arena-core'

import SystemError from '@core/systemError'
import * as SurveyFile from '@core/survey/surveyFile'

import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'
import { FileImportBaseJob } from './filesImportBaseJob'

export default class FilesImportJob extends FileImportBaseJob {
  constructor(params) {
    super('FilesImportJob', params)
  }

  async execute() {
    const { surveyId, skipMissingFiles = false } = this.context
    const filesSummaries = await this.fetchFilesSummaries()

    await this.checkFileUuidsAreValid(filesSummaries)

    if (filesSummaries?.length > 0) {
      await this.checkFilesNotExceedingAvailableQuota(filesSummaries)

      this.total = filesSummaries.length

      for (const fileSummary of filesSummaries) {
        let file = { ...fileSummary }

        file = SurveyFile.cleanupInvalidProps(file)

        // load file content from a separate file
        const fileUuid = SurveyFile.getUuid(fileSummary)
        const fileName = SurveyFile.getName(fileSummary)
        const fileContent = await this.fetchFileContent({ fileName, fileUuid })
        if (!fileContent && !skipMissingFiles) {
          throw new Error(`Missing content for file ${fileUuid} (${fileName})`)
        }
        if (fileContent) {
          file = SurveyFile.assocContent(fileContent)(file)

          // update file size with actual file content length
          file = SurveyFile.assocSize(Buffer.byteLength(fileContent))(file)

          await this.persistFile(file)
        } else {
          const recordUuid = SurveyFile.getRecordUuid(fileSummary)
          this.logWarn(`Survey ${surveyId} record ${recordUuid}: missing content for file ${fileUuid} (${fileName})`)
          this.missingFileSummaries.push(fileSummary)
        }
        this.incrementProcessedItems()
      }
      await this.deleteOrphanFiles()
    } else {
      this.logInfo('no files found')
    }
  }

  async fetchFilesSummaries() {
    const { arenaSurveyFileZip } = this.context
    return ArenaSurveyFileZip.getFilesSummaries(arenaSurveyFileZip)
  }

  async fetchFileContent({ fileName: _fileName, fileUuid }) {
    const { arenaSurveyFileZip } = this.context
    return ArenaSurveyFileZip.getFile(arenaSurveyFileZip, fileUuid)
  }

  async checkFilesNotExceedingAvailableQuota(filesSummaries) {
    const { surveyId } = this.context
    const filesStatistics = await SurveyFileService.fetchFilesStatistics({ surveyId })
    const totalSize = filesSummaries.reduce((tot, fileSummary) => tot + SurveyFile.getSize(fileSummary), 0)
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

    const filesUuids = filesSummaries.map(SurveyFile.getUuid)
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

  async deleteOrphanFiles() {
    const { context, tx } = this
    const { dryRun, filesToDeleteByUuid, updatedFilesByUuid, surveyId } = context

    if (Objects.isEmpty(filesToDeleteByUuid)) return

    const filesToDeleteArray = Object.values(filesToDeleteByUuid)
    for (const file of filesToDeleteArray) {
      const fileUuid = SurveyFile.getUuid(file)
      if (!updatedFilesByUuid[fileUuid]) {
        if (!dryRun) {
          await SurveyFileService.deleteFileByUuid({ surveyId, fileUuid }, tx)
        }
        this.deletedFileUuids.push(fileUuid)
      }
    }
  }
}
