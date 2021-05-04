import axios from 'axios'

import { SurveyState } from '@webapp/store/survey'

import { ChainActionTypes } from './actionTypes'

export const fetchChainNodeDefs = ({ chainUuid, entityDefUuid }) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const { data: chainNodeDefs } = await axios.get(
    `/api/survey/${surveyId}/chain/${chainUuid}/chain-node-def/${entityDefUuid}`
  )

  dispatch({ type: ChainActionTypes.chainNodeDefsUpdate, chainNodeDefs })
}
