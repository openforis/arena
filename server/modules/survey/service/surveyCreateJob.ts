import * as Survey from '@core/survey/survey'
import Job, { type JobParams } from '@server/job/job'
import * as SurveyManager from '../manager/surveyManager'

export default class SurveyCreatorJob extends Job {
  static readonly type: string = 'SurveyCreatorJob'

  constructor(params?: Partial<JobParams>) {
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

  beforeSuccess() {
    const { surveyId } = this.context
    this.setResult({ surveyId })
    return Promise.resolve()
  }
}
