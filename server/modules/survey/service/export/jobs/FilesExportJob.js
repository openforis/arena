import * as PromiseUtils from '@core/promiseUtils'
import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import * as FileService from '@server/modules/record/service/fileService'

export default class FilesExportJob extends Job {
  constructor(params) {
    super('FilesExportJob', params)
  }

  async execute() {
    const { survey, cycle, includeDataFromAllCycles, outputDir } = this.context

    const surveyId = Survey.getId(survey)

    const { fileUuidsByCycle, total } = await SurveyRdbService.fetchEntitiesFileUuidsByCycle(
      {
        user: this.user,
        survey,
        cycle,
        includeDataFromAllCycles,
      },
      this.tx
    )
    this.total = total

    // write the files in subfolders by cycle
    await PromiseUtils.each(Object.entries(fileUuidsByCycle), async ([cycle, fileUuids]) => {
      await PromiseUtils.each(fileUuids, async (fileUuid) => {
        const recordFileContent = await FileService.fetchFileContentAsStream({ surveyId, fileUuid }, this.tx)
        const cycleFilesPath = FileUtils.join(outputDir, 'files', cycle)
        if (!FileUtils.exists(cycleFilesPath)) {
          await FileUtils.mkdir(cycleFilesPath)
        }
        const tempFilePath = FileUtils.join(cycleFilesPath, fileUuid)
        await FileUtils.writeFile(tempFilePath, recordFileContent)
        this.incrementProcessedItems()
      })
    })
  }
}
