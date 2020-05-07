import * as ProcessingChain from '@common/analysis/processingChain'

import * as SurveyState from '@webapp/survey/surveyState'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { initChain } from '@webapp/loggedin/modules/analysis/chain/actions'

export const navigateToChainView = (history, processingChainUuid) => () =>
  history.push(`${appModuleUri(analysisModules.processingChain)}${processingChainUuid}`)

// ====== CREATE

export const createChain = (history) => async (dispatch, getState) => {
  const surveyCycleKey = SurveyState.getSurveyCycleKey(getState())

  const processingChain = ProcessingChain.newProcessingChain({
    [ProcessingChain.keysProps.cycles]: [surveyCycleKey],
  })

  await dispatch(initChain(processingChain))

  dispatch(navigateToChainView(history, ProcessingChain.getUuid(processingChain)))
}
