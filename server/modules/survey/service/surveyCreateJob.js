import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'

import * as SurveyManager from '../manager/surveyManager'

export default class SurveyCreatorJob extends Job {
  constructor(params) {
    super(SurveyCreatorJob.type, params)
  }

  async execute() {
    const { user, surveyInfo, createRootEntityDef, updateUserPrefs, temporary } = this.context

    // Insert survey out of this job's own transaction (this.tx): SurveyManager.insertSurvey creates the
    // survey data schema, which uses its own separate db connections and must not run inside an open one.
    const survey = await SurveyManager.insertSurvey({
      user,
      surveyInfo,
      createRootEntityDef,
      updateUserPrefs,
      temporary,
    })

    const surveyId = Survey.getId(survey)

    this.setContext({ survey, surveyId })
  }

  async beforeSuccess() {
    const { surveyId } = this.context
    this.setResult({ surveyId })
  }
}

SurveyCreatorJob.type = 'SurveyCreatorJob'
