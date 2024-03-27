import axios from 'axios'

import { SurveyState } from '@webapp/store/survey'
import { LoaderActions } from '@webapp/store/ui/loader'

import { ChainActionTypes } from './actionTypes'

export const fetchChain =
  ({ chainUuid }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const { data: chain } = await axios.get(`/api/survey/${surveyId}/chain/${chainUuid}`)

    dispatch({ type: ChainActionTypes.chainUpdate, chain })
    dispatch(LoaderActions.hideLoader())
  }
