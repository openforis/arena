import * as R from 'ramda'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

export default class ProcessingChainsCyclesCheckJob extends Job {
  constructor(params) {
    super(ProcessingChainsCyclesCheckJob.type, params)
  }

  async execute() {
    this.total = 4

    const { cycleKeys, cycleKeysDeleted = [] } = await this._getCycleKeys()
    // 1. set all survey cycles to all nodeDef analysis
    await NodeDefManager.updateNodeDefAnalysisCycles(this.surveyId, cycleKeys, this.tx)
    this.incrementProcessedItems()

    // 2. dissoc deleted survey cycles from processing chains
    if (!R.isEmpty(cycleKeysDeleted)) {
      await ProcessingChainManager.removeCyclesFromChains(this.surveyId, cycleKeysDeleted, this.tx)
    }

    this.incrementProcessedItems()

    // 3. delete processing chains with no cycles
    await ProcessingChainManager.deleteChainsWithoutCycles(this.surveyId, this.tx)
    this.incrementProcessedItems()

    // 4. delete analysis nodeDef if they are not used
    await NodeDefManager.deleteNodeDefsAnalysisUnused(this.surveyId, this.tx)
    this.incrementProcessedItems()
  }

  async _getCycleKeys() {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, false, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const cycleKeys = Survey.getCycleKeys(surveyInfo)
    if (Survey.isPublished(surveyInfo)) {
      const surveyPrev = await SurveyManager.fetchSurveyById(this.surveyId, false, false, this.tx)
      const surveyInfoPrev = Survey.getSurveyInfo(surveyPrev)
      const cycleKeysDeleted = R.difference(Survey.getCycleKeys(surveyInfoPrev), cycleKeys)
      return { cycleKeys, cycleKeysDeleted }
    }

    return { cycleKeys }
  }
}

ProcessingChainsCyclesCheckJob.type = 'ProcessingChainsCyclesCheckJob'
