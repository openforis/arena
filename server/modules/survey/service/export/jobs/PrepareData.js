import * as Survey from '@core/survey/survey'
import * as ProcessUtils from '@core/processUtils'
import * as DateUtils from '@core/dateUtils'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as CSVWriter from '@server/utils/file/csvWriter'

export default class PrepareData extends Job {
  constructor(params) {
    super('PrepareData', params)
  }

  async execute() {
    const { surveyId } = this.context

    const survey = await SurveyManager.fetchSurveyById(surveyId, true, false, this.tx)

    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyName = Survey.getName(surveyInfo)

    const exportDataFolderName = `${surveyName}_export_${DateUtils.nowFormatDefault()}`
    const dir = FileUtils.join(ProcessUtils.ENV.tempFolder, exportDataFolderName)
    await FileUtils.rmdir(dir)
    await FileUtils.mkdir(dir)

    const tables = await SurveyRdbManager.getTables(surveyId, this.tx)
    await Promise.all(
      tables.map(async ({ schemaname, tablename }) => {
        const data = await this.tx.query(`SELECT * from ${schemaname}.${tablename}`)
        await CSVWriter.writeToFile(FileUtils.join(dir, `${tablename}.csv`), data)
      })
    )

    this.setContext({ dir, exportDataFolderName })
  }
}
