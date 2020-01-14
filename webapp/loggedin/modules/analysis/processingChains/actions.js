import axios from 'axios'

import * as ProcessingChain from '@common/analysis/processingChain'

import * as SurveyState from '@webapp/survey/surveyState'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { processingChainUpdate } from '@webapp/loggedin/modules/analysis/processingChain/actions'

// ====== CREATE

export const navigateToProcessingChainView = (history, processingChainUuid) => () =>
  history.push(`${appModuleUri(analysisModules.processingChain)}${processingChainUuid}`)

export const createProcessingChain = history => async (dispatch, getState) => {
  const state = getState()
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  const processingChain = ProcessingChain.newProcessingChain(surveyCycleKey)
  dispatch({ type: processingChainUpdate, processingChain })

  dispatch(navigateToProcessingChainView(history, ProcessingChain.getUuid(processingChain)))
}

// ====== READ

export const fetchProcessingChain = (history, processingChainUuid, navigateToChainView = true) => async (
  dispatch,
  getState,
) => {
  dispatch(showAppLoader())
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: processingChain } = await axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}`)

  await dispatch({ type: processingChainUpdate, processingChain })
  dispatch(hideAppLoader())

  if (navigateToChainView) dispatch(navigateToProcessingChainView(history, processingChainUuid))
}
