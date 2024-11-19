import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import * as FileService from '@server/modules/record/service/fileService'

const filesOutputDir = 'files'

export default class FilesExportJob extends Job {
  constructor(params) {
    super('FilesExportJob', params)
  }

  async execute() {
    const { survey, cycle, includeDataFromAllCycles, recordUuids } = this.context

    const { fileUuidsByCycle, total } = await SurveyRdbService.fetchEntitiesFileUuidsByCycle(
      {
        user: this.user,
        survey,
        cycle,
        includeDataFromAllCycles,
        filterRecordUuids: recordUuids,
      },
      this.tx
    )
    this.total = total

    // write the files in subfolders by cycle
    for await (const [cycle, fileUuids] of Object.entries(fileUuidsByCycle)) {
      for await (const fileUuid of fileUuids) {
        await this.writeFile({ fileUuid, cycle })
        this.incrementProcessedItems()
      }
    }
  }

  async writeFile({ fileUuid, cycle }) {
    const { survey, outputDir, fileNamesByFileUuid } = this.context
    const surveyId = Survey.getId(survey)

    const fileSummary = await FileService.fetchFileSummaryByUuid(surveyId, fileUuid, this.tx)
    if (!fileSummary) {
      this.logWarn(`File with UUID ${fileUuid} not found`)
      return false
    }
    const recordFileContent = await FileService.fetchFileContentAsStream({ surveyId, fileUuid }, this.tx)
    if (!recordFileContent) {
      this.logWarn(`File content for file with UUID ${fileUuid} not found`)
      return false
    }
    const cycleFilesOutputDirPath = FileUtils.join(outputDir, filesOutputDir, cycle)
    if (!FileUtils.exists(cycleFilesOutputDirPath)) {
      await FileUtils.mkdir(cycleFilesOutputDirPath)
    }
    const exportedFileName = fileNamesByFileUuid[fileUuid]
    const tempFilePath = FileUtils.join(cycleFilesOutputDirPath, exportedFileName)
    await FileUtils.writeFile(tempFilePath, recordFileContent)

    return true
  }
}
