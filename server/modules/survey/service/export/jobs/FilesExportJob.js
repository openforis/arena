import * as PromiseUtils from '@core/promiseUtils'
import * as Survey from '@core/survey/survey'
import * as RecordFile from '@core/record/recordFile'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import * as FileService from '@server/modules/record/service/fileService'
import { Objects } from '@openforis/arena-core'

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
        const fileSummary = await FileService.fetchFileSummaryByUuid(surveyId, fileUuid, this.tx)
        const recordFileContent = await FileService.fetchFileContentAsStream({ surveyId, fileUuid }, this.tx)
        const cycleFilesPath = FileUtils.join(outputDir, 'files', cycle)
        if (!FileUtils.exists(cycleFilesPath)) {
          await FileUtils.mkdir(cycleFilesPath)
        }
        const extension = RecordFile.getExtension(fileSummary)
        const exportedFileName = Objects.isEmpty(extension) ? fileUuid : `${fileUuid}.${extension}`
        const tempFilePath = FileUtils.join(cycleFilesPath, exportedFileName)
        await FileUtils.writeFile(tempFilePath, recordFileContent)
        this.incrementProcessedItems()
      })
    })
  }
}
