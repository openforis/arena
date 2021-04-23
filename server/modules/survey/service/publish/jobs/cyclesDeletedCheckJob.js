import * as R from 'ramda'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'

import * as SurveyManager from '../../../manager/surveyManager'
import * as NodeDefManager from '../../../../nodeDef/manager/nodeDefManager'
import * as RecordManager from '../../../../record/manager/recordManager'
import * as UserManager from '../../../../user/manager/userManager'

export default class CyclesDeletedCheckJob extends Job {
  constructor(params) {
    super(CyclesDeletedCheckJob.type, params)
  }

  async execute() {
    this.total = 4

    // 1. find deleted cycles
    this.logDebug('finding deleted cycles')
    const cycleKeysDeleted = await this._findDeletedCycleKeys()
    this.logDebug(`deleted cycles keys: ${cycleKeysDeleted}`)
    this.incrementProcessedItems()

    if (!R.isEmpty(cycleKeysDeleted)) {
      // 2. mark node defs without cycles as 'deleted'
      this.logDebug('marking node defs without cycles as deleted')
      await NodeDefManager.markNodeDefsWithoutCyclesDeleted(this.surveyId, this.tx)
      this.logDebug('node defs without cycles marked as deleted')
      this.incrementProcessedItems()

      // 3. delete records of deleted cycles
      this.logDebug('deleting records')
      const recordsDeletedUuids = await RecordManager.deleteRecordsByCycles(this.surveyId, cycleKeysDeleted, this.tx)
      this.logDebug(`records deleted: ${R.length(recordsDeletedUuids)}`)
      this.incrementProcessedItems()

      // 4. reset users pref cycle (if among deleted ones)
      this.logDebug('updating users prefs')
      await UserManager.resetUsersPrefsSurveyCycle(this.surveyId, cycleKeysDeleted, this.tx)
      this.logDebug('users prefs updated')
    }

    this.incrementProcessedItems()
  }

  async _findDeletedCycleKeys() {
    const survey = await SurveyManager.fetchSurveyById({ surveyId: this.surveyId, draft: true }, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    if (Survey.isPublished(surveyInfo)) {
      const surveyPrev = await SurveyManager.fetchSurveyById({ surveyId: this.surveyId }, this.tx)
      const surveyInfoPrev = Survey.getSurveyInfo(surveyPrev)
      return R.difference(Survey.getCycleKeys(surveyInfoPrev), Survey.getCycleKeys(surveyInfo))
    }

    return []
  }
}

CyclesDeletedCheckJob.type = 'CyclesDeletedCheckJob'
