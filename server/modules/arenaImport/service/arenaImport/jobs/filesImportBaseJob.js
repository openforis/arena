import SystemError from '@core/systemError'
import * as SurveyFile from '@core/survey/surveyFile'

import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'

import Job from '@server/job/job'

export class FileImportBaseJob extends Job {
  constructor(type, params) {
    super(type, params)
    this.insertedFileUuids = []
    this.updatedFileUuids = []
    this.deletedFileUuids = []
    this.missingFileSummaries = []
  }

  async checkFilesNotExceedingAvailableQuota(filesSummaries) {
    const { surveyId } = this.context
    const filesStatistics = await SurveyFileService.fetchFilesStatistics({ surveyId })
    const totalSize = filesSummaries.reduce((tot, fileSummary) => tot + SurveyFile.getSize(fileSummary), 0)
    if (totalSize > filesStatistics.availableSpace) {
      throw new SystemError('cannotImportFilesExceedingQuota')
    }
  }

  async persistFile(file) {
    const { context, tx } = this
    const { surveyId, dryRun } = context
    const fileUuid = SurveyFile.getUuid(file)
    const fileProps = SurveyFile.getProps(file)
    this.logDebug(`persisting file ${fileUuid}`)
    const existingFileSummary = await SurveyFileService.fetchFileSummaryByUuid(surveyId, fileUuid, this.tx)
    if (existingFileSummary) {
      this.logDebug(`file already existing`)
      if (SurveyFile.isDeleted(existingFileSummary)) {
        this.logDebug(`file previously marked as deleted: delete permanently and insert a new one`)
        if (!dryRun) {
          await SurveyFileService.deleteFileByUuid({ surveyId, fileUuid }, tx)
          await SurveyFileService.insertFile(surveyId, file, tx)
        }
        this.insertedFileUuids.push(fileUuid)
      } else {
        this.logDebug('updating props')
        if (!dryRun) {
          await SurveyFileService.updateFileProps(surveyId, fileUuid, fileProps, tx)
        }
        this.updatedFileUuids.push(fileUuid)
      }
    } else {
      this.logDebug(`file not existing: inserting new file`, fileProps)
      if (!dryRun) {
        await SurveyFileService.insertFile(surveyId, file, tx)
      }
      this.insertedFileUuids.push(fileUuid)
    }
  }

  generateResult() {
    const result = super.generateResult()
    return {
      ...result,
      insertedFiles: this.insertedFileUuids.length,
      updatedFiles: this.updatedFileUuids.length,
      deletedFiles: this.deletedFileUuids.length,
      missingFiles: this.missingFileSummaries.length,
    }
  }
}
