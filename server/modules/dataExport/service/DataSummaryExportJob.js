import Job from '@server/job/job'

import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'


export default class DataSummaryExportJob extends Job {
  constructor(params) {
    super(DataSummaryExportJob.type, params)
  }

  async execute() {
    const { cycle, outputDir } = this.context

    const survey = await SurveyService.fetchSurveyAndNodeDefsBySurveyId({
      surveyId,
      cycle: cycleToFetch,
      includeAnalysis,
    })

    SurveyRdbService.get
  }
}

DataSummaryExportJob.type = 'DataSummaryExportJob'
