import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import Job, { type JobParams } from '@server/job/job'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export default class ChainsCyclesCheckJob extends Job {
  static readonly type: string = 'ChainsCyclesCheckJob'

  constructor(params?: Partial<JobParams>) {
    super(ChainsCyclesCheckJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this
    const { cycleKeys } = await this._getCycleKeys()
    // 1. set all survey cycles to all nodeDef analysis
    await NodeDefManager.updateNodeDefAnalysisCycles(surveyId, cycleKeys, tx)
  }

  async _getCycleKeys() {
    const survey = await SurveyManager.fetchSurveyById({ surveyId: this.surveyId, draft: true }, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const cycleKeys = Survey.getCycleKeys(surveyInfo)
    if (Survey.isPublished(surveyInfo)) {
      const surveyPrev = await SurveyManager.fetchSurveyById({ surveyId: this.surveyId }, this.tx)
      const surveyInfoPrev = Survey.getSurveyInfo(surveyPrev)
      const cycleKeysDeleted = A.difference(Survey.getCycleKeys(surveyInfoPrev), cycleKeys)
      return { cycleKeys, cycleKeysDeleted }
    }

    return { cycleKeys }
  }
}
