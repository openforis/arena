import axios from 'axios'

import * as ProcessingChain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as SurveyState from '@webapp/survey/surveyState'

import { showNotification } from '@webapp/app/appNotification/actions'
import { hideAppLoader, hideAppSaving, showAppLoader, showAppSaving } from '@webapp/app/actions'
import * as ProcessingChainState from './processingChainState'

export const processingChainUpdate = 'analysis/processingChain/update'
export const processingChainPropUpdate = 'analysis/processingChain/prop/update'
export const processingChainSave = 'analysis/processingChain/save'

export const processingChainStepsLoad = 'analysis/processingChain/steps/load'
export const processingStepForEditUpdate = 'analysis/processingChain/step/forEdit/update'

export const resetProcessingChainState = () => dispatch =>
  dispatch({ type: processingChainUpdate, processingChain: {} })

export const navigateToProcessingChainsView = history => dispatch => {
  dispatch(resetProcessingChainState())
  // Navigate to processing chains view
  history.push(appModuleUri(analysisModules.processingChains))
}

export const navigateToProcessingStepView = (history, processingStepUuid) => _ =>
  history.push(`${appModuleUri(analysisModules.processingStep)}${processingStepUuid}`)

export const setProcessingStepForEdit = processingStep => dispatch =>
  dispatch({ type: processingStepForEditUpdate, processingStep })

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

  await axios.put(`/api/survey/${surveyId}/processing-chain/`, { chain })

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
