import axios from 'axios'

import ProcessingChain from '@common/analysis/processingChain'

import { debounceAction } from '@webapp/utils/reduxUtils'
import { analysisModules, appModuleUri } from '@webapp/loggedin/appModules'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingChainState from './processingChainState'

import { showNotification } from '@webapp/app/appNotification/actions'

export const processingChainUpdate = 'survey/processingChain/update'
export const processingChainPropUpdate = 'survey/processingChain/prop/update'

export const processingChainStepsLoad = 'survey/processingChain/steps/load'

export const resetProcessingChainState = () => dispatch =>
  dispatch({ type: processingChainUpdate, processingChain: {} })

export const navigateToProcessingChainsView = history => dispatch => {
  dispatch(resetProcessingChainState())
  // navigate to processing chains view
  history.push(appModuleUri(analysisModules.processingChains))
}

// ====== READ

export const fetchProcessingChain = processingChainUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: processingChain } = await axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}`)

  dispatch({ type: processingChainUpdate, processingChain })
}

export const fetchProcessingSteps = processingChainUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const { data: processingSteps } = await axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}/processing-steps`)

  dispatch({ type: processingChainStepsLoad, processingSteps })
}

// ====== UPDATE
export const putProcessingChainProp = (key, value) => async (dispatch, getState) => {
  const state = getState()

  const processingChain = ProcessingChainState.getProcessingChain(state)

  dispatch({ type: processingChainPropUpdate, key, value })

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(state)
    await axios.put(
      `/api/survey/${surveyId}/processing-chain/${ProcessingChain.getUuid(processingChain)}`,
      { key, value }
    )
  }
  dispatch(debounceAction(action, `${processingChainPropUpdate}_${ProcessingChain.getUuid(processingChain)}`))
}

// ====== DELETE
export const deleteProcessingChain = history => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingChain = ProcessingChainState.getProcessingChain(state)

  await axios.delete(`/api/survey/${surveyId}/processing-chain/${ProcessingChain.getUuid(processingChain)}`)

  dispatch(navigateToProcessingChainsView(history))
  dispatch(showNotification('processingChainView.deleteComplete'))
}