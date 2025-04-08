import Job from '@server/job/job'

import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'

export default class DataSummaryExportJob extends Job {
  constructor(params) {
    super(DataSummaryExportJob.type, params)
  }

  async execute() {
    const { cycle, surveyId, lang, options = {} } = this.context
    const exportUuid = this.uuid // use job uuid as export uuid

    const survey = await SurveyService.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

    await SurveyRdbService.fetchEntitiesDataSummaryToFlatData({ exportUuid, survey, cycle, lang, options })

    this.setContext({ exportUuid })
  }

  async beforeSuccess() {
    await super.beforeSuccess()

    const { exportUuid } = this.context

    this.setResult({ exportUuid })
  }
}

DataSummaryExportJob.type = 'DataSummaryExportJob'
