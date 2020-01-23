import * as R from 'ramda'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'

import * as SurveyManager from '../../../manager/surveyManager'
import * as NodeDefManager from '../../../../nodeDef/manager/nodeDefManager'
import * as RecordManager from '../../../../record/manager/recordManager'
import * as UserManager from '../../../../user/manager/userManager'

export default class ProcessingChainsCyclesCheckJob extends Job {
  constructor(params) {
    super(ProcessingChainsCyclesCheckJob.type, params)
  }

  async execute() {
    this.total = 4

    // Const {cycleKeys, cycleKeysDeleted} = await _getCycleKeys()
    // 1. set all survey cycles to all nodeDef analysis

    // 2. dissoc deleted survey  cycles from processing chains

    // 3. delete processing chains with no cycles

    // 4. delete analysis nodeDef if they are not used
  }

  // Async _getCycleKeys() {
  //   const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, false, this.tx)
  //   const surveyInfo = Survey.getSurveyInfo(survey)
  //   const cycleKeys = Survey.getCycleKeys(surveyInfo)
  //   if (Survey.isPublished(surveyInfo)) {
  //     const surveyPrev = await SurveyManager.fetchSurveyById(this.surveyId, false, false, this.tx)
  //     const surveyInfoPrev = Survey.getSurveyInfo(surveyPrev)
  //     const cycleKeysDeleted = R.difference(Survey.getCycleKeys(surveyInfoPrev), cycleKeys)
  //     return {cycleKeys, cycleKeysDeleted}
  //   }
  //
  //   return {cycleKeys}
  // }
}

ProcessingChainsCyclesCheckJob.type = 'ProcessingChainsCyclesCheckJob'
