import axios from 'axios'

import { LoaderActions } from '@webapp/store/ui/loader'
import { SurveyState } from '@webapp/store/survey'

import { ChainActionTypes } from './actionTypes'

export const fetchChain = ({ chainUuid }) => async (dispatch, getState) => {
  dispatch(LoaderActions.showLoader())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const [{ data: chain }, { data: chainNodeDefsCount }] = await Promise.all([
    axios.get(`/api/survey/${surveyId}/chain/${chainUuid}`),
    axios.get(`/api/survey/${surveyId}/chain/${chainUuid}/chain-node-def/count`),
  ])

  dispatch({ type: ChainActionTypes.chainUpdate, chain, chainNodeDefsCount })
  dispatch(LoaderActions.hideLoader())
}
