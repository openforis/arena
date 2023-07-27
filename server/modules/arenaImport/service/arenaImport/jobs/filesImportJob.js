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
    const { arenaSurveyFileZip, surveyId } = this.context

    const filesSummaries = await ArenaSurveyFileZip.getFilesSummaries(arenaSurveyFileZip)
    if (filesSummaries && filesSummaries.length > 0) {
      await this.checkFilesNotExceedingAvailableQuota(filesSummaries)

      this.total = filesSummaries.length
      await PromiseUtils.each(filesSummaries, async (fileSummary) => {
        let file = { ...fileSummary }
        // load file content from a separate file
        const fileContent = await ArenaSurveyFileZip.getFile(arenaSurveyFileZip, RecordFile.getUuid(fileSummary))
        file = RecordFile.assocContent(fileContent)(file)

        await this.persistFile(file)

        this.incrementProcessedItems()
      })
    } else {
      // old format
      const fileUuids = await ArenaSurveyFileZip.getFileUuidsOld(arenaSurveyFileZip)
      this.total = fileUuids.length

      await PromiseUtils.each(fileUuids, async (fileUuid) => {
        const file = await ArenaSurveyFileZip.getFileOld(arenaSurveyFileZip, fileUuid)
        await FileService.insertFile(surveyId, file, this.tx)
        this.incrementProcessedItems()
      })
    }
  }

  async persistFile(file) {
    const { surveyId } = this.context
    const existingFileSummary = await FileService.fetchFileSummaryByUuid(surveyId, file.uuid, this.tx)
    if (existingFileSummary) {
      await FileService.updateFileProps(surveyId, RecordFile.getUuid(file), RecordFile.getProps(file), this.tx)
    } else {
      await FileService.insertFile(surveyId, file, this.tx)
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
}
