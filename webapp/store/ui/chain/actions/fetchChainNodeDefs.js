import axios from 'axios'

import { SurveyState } from '@webapp/store/survey'

import { ChainActionTypes } from './actionTypes'

export const fetchChainNodeDefs = ({ entityDefUuid }) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const { chain } = state.ui.chain

  const { data: chainNodeDefs } = await axios.get(
    `/api/survey/${surveyId}/chain/${chain.uuid}/chain-node-def/${entityDefUuid}`
  )

  dispatch({ type: ChainActionTypes.chainNodeDefsUpdate, chainNodeDefs })
}
