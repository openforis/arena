import axios from 'axios'

import * as ProcessingChain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingChainState from './processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { showNotification } from '@webapp/app/appNotification/actions'
import { hideAppSaving, showAppSaving } from '@webapp/app/actions'

export const processingChainReset = 'analysis/processingChain/reset'
export const processingChainUpdate = 'analysis/processingChain/update'
export const processingChainPropUpdate = 'analysis/processingChain/prop/update'
export const processingChainSave = 'analysis/processingChain/save'

export const processingChainStepsLoad = 'analysis/processingChain/steps/load'

export const resetProcessingChainState = () => dispatch => dispatch({ type: processingChainReset })

export const navigateToProcessingChainsView = history => dispatch => {
  dispatch(resetProcessingChainState())
  // Navigate to processing chains view
  history.push(appModuleUri(analysisModules.processingChains))
}

// ====== READ

export const fetchProcessingChain = processingChainUuid => async (dispatch, getState) => {
  dispatch(showAppSaving())
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: processingChain } = await axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}`)

  dispatch({ type: processingChainUpdate, processingChain })
  dispatch(hideAppSaving())
}

export const fetchProcessingSteps = processingChainUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: processingSteps } = await axios.get(
    `/api/survey/${surveyId}/processing-chain/${processingChainUuid}/processing-steps`,
  )

  dispatch({ type: processingChainStepsLoad, processingSteps })
}

// ====== UPDATE

export const updateProcessingChainProp = (key, value) => dispatch =>
  dispatch({ type: processingChainPropUpdate, key, value })

export const saveProcessingChain = () => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const chain = ProcessingChainState.getProcessingChain(state)
  const step = ProcessingStepState.getProcessingStep(state)

  await axios.put(`/api/survey/${surveyId}/processing-chain/`, { chain, step })

  dispatch(showNotification('common.saved'))
  dispatch({ type: processingChainSave })
  dispatch(hideAppSaving())
}

// ====== DELETE

export const deleteProcessingChain = history => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingChain = ProcessingChainState.getProcessingChain(state)

  await axios.delete(`/api/survey/${surveyId}/processing-chain/${ProcessingChain.getUuid(processingChain)}`)

  dispatch(navigateToProcessingChainsView(history))
  dispatch(showNotification('processingChainView.deleteComplete'))
  dispatch(hideAppSaving())
}
