import axios from 'axios'

import * as ProcessingChain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as SurveyState from '@webapp/survey/surveyState'

import { showNotification } from '@webapp/app/appNotification/actions'
import { hideAppLoader, hideAppSaving, showAppLoader, showAppSaving } from '@webapp/app/actions'
import * as ProcessingChainState from './processingChainState'

export const processingChainUpdate = 'survey/processingChain/update'
export const processingChainPropUpdate = 'survey/processingChain/prop/update'
export const processingChainSave = 'survey/processingChain/save'

export const processingChainStepsLoad = 'survey/processingChain/steps/load'

export const resetProcessingChainState = () => dispatch =>
  dispatch({ type: processingChainUpdate, processingChain: {} })

export const navigateToProcessingChainsView = history => dispatch => {
  dispatch(resetProcessingChainState())
  // Navigate to processing chains view
  history.push(appModuleUri(analysisModules.processingChains))
}

export const navigateToProcessingStepView = (history, processingStepUuid) => _ =>
  history.push(`${appModuleUri(analysisModules.processingStep)}${processingStepUuid}`)

// ====== CREATE

export const createProcessingStep = history => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const processingChain = ProcessingChainState.getProcessingChain(state)
  const processingChainUuid = ProcessingChain.getUuid(processingChain)
  const processingSteps = ProcessingChain.getProcessingSteps(processingChain)
  const processingStepIndex = processingSteps.length

  const { data: processingStepUuid } = await axios.post(
    `/api/survey/${surveyId}/processing-chain/${processingChainUuid}/processing-step`,
    {
      processingStepIndex,
    },
  )

  dispatch(navigateToProcessingStepView(history, processingStepUuid))
  dispatch(hideAppLoader())
}

// ====== READ

// TODO - REMOVE - used in stepView
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

  const processingChain = ProcessingChainState.getProcessingChain(state)
  const surveyId = SurveyState.getSurveyId(state)

  await axios.put(`/api/survey/${surveyId}/processing-chain/`, { processingChain })

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
