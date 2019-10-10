import axios from 'axios'

import ProcessingChain from '../../../../../common/analysis/processingChain'

import * as SurveyState from '../../../../survey/surveyState'

import { debounceAction } from '../../../../utils/reduxUtils'

import * as ProcessingChainViewState from './processingChainViewState'

export const processingChainUpdate = '/analysis/processingChain/update'
export const processingChainPropUpdate = '/analysis/processingChain/prop/update'

// ====== READ

export const fetchProcessingChain = processingChainUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const { data: { processingChain } } = await axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}`)

  dispatch({ type: processingChainUpdate, processingChain })
}

// ====== UPDATE
export const putProcessingChainProp = (key, value) => async (dispatch, getState) => {
  const state = getState()

  const processingChain = ProcessingChainViewState.getProcessingChain(state)

  dispatch({ type: processingChainPropUpdate, key, value })

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(getState())
    await axios.put(
      `/api/survey/${surveyId}/processing-chain/${ProcessingChain.getUuid(processingChain)}`,
      { key, value }
    )
  }
  dispatch(debounceAction(action, `${processingChainPropUpdate}_${ProcessingChain.getUuid(processingChain)}`))
}
