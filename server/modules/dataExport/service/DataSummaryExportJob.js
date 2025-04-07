import Job from '@server/job/job'

import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'

export default class DataSummaryExportJob extends Job {
  constructor(params) {
    super(DataSummaryExportJob.type, params)
  }

  async execute() {
    const { cycle, surveyId, options = {} } = this.context

    const survey = await SurveyService.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

    await SurveyRdbService.fetchEntitiesDataSummaryToFlatData({ survey, cycle, options })
  }
}

DataSummaryExportJob.type = 'DataSummaryExportJob'
