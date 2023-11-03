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
    if (filesSummaries && filesSummaries.length > 0) {
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
    }
  }

  checkFileUuidIsInRecords(fileUuid) {
    const { recordsFileUuids } = this.context
    if (recordsFileUuids && !recordsFileUuids.includes(fileUuid)) {
      throw new Error(`File UUID ${fileUuid} not found in records`)
    }
  }

  async persistFile(file) {
    const { surveyId } = this.context
    const fileUuid = RecordFile.getUuid(file)
    const existingFileSummary = await FileService.fetchFileSummaryByUuid(surveyId, fileUuid, this.tx)
    if (existingFileSummary) {
      await FileService.updateFileProps(surveyId, fileUuid, RecordFile.getProps(file), this.tx)
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
