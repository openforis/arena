import * as ProcessingChain from '@common/analysis/processingChain'

import * as SurveyState from '@webapp/survey/surveyState'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { initProcessingChain } from '@webapp/loggedin/modules/analysis/processingChain/actions'

// ====== CREATE

export const createProcessingChain = history => async (dispatch, getState) => {
  const surveyCycleKey = SurveyState.getSurveyCycleKey(getState())

  const processingChain = ProcessingChain.newProcessingChain({
    [ProcessingChain.keysProps.cycles]: [surveyCycleKey],
  })

  await dispatch(initProcessingChain(processingChain))

  dispatch(navigateToProcessingChainView(history, ProcessingChain.getUuid(processingChain)))
}

// ====== UTILS

export const navigateToProcessingChainView = (history, processingChainUuid) => () =>
  history.push(`${appModuleUri(analysisModules.processingChain)}${processingChainUuid}`)
