import axios from 'axios'

import ProcessingChain from '../../../../../common/analysis/processingChain'

import * as SurveyState from '../../../../survey/surveyState'

import { debounceAction } from '../../../../utils/reduxUtils'

import * as ProcessingChainState from './processingChainState'
import { analysisModules, appModuleUri } from '../../../appModules'
import { showNotificationMessage } from '../../../../app/actions'
import { notificationSeverity } from '../../../../app/appState'

export const processingChainUpdate = '/analysis/processingChain/update'
export const processingChainPropUpdate = '/analysis/processingChain/prop/update'

export const navigateToProcessingChainsView = history => dispatch => {
  // reset current processing chain
  dispatch({ type: processingChainUpdate, processingChain: null })
  // navigate to processing chains view
  history.push(appModuleUri(analysisModules.processingChains))
}

// ====== READ

export const fetchProcessingChain = processingChainUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const { data: { processingChain } } = await axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}`)

  dispatch({ type: processingChainUpdate, processingChain })
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
  dispatch(showNotificationMessage('analysis.processingChain.deleteComplete', {}, notificationSeverity.info))
}
