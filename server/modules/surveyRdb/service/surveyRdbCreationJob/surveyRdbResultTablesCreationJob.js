import * as R from 'ramda'

import Job from '@server/job/job'

import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

export default class SurveyRdbResultTablesCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbResultTablesCreationJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    await SurveyRdbManager.createResultNodeTable(surveyId, tx)

    const resultStepViewsByEntityUuid = await SurveyRdbManager.getResultStepViews(surveyId, tx)
    const resultStepViews = R.pipe(R.values, R.flatten)(resultStepViewsByEntityUuid)
    await Promise.all(
      resultStepViews.map((resultStepView) => SurveyRdbManager.createResultStepView(surveyId, resultStepView, tx))
    )
  }
}

SurveyRdbResultTablesCreationJob.type = 'SurveyRdbResultTablesCreationJob'
