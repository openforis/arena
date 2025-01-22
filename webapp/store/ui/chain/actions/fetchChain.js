import axios from 'axios'

import { LoaderActions } from '@webapp/store/ui/loader'
import { SurveyState } from '@webapp/store/survey'

import { ChainActionTypes } from './actionTypes'

export const fetchChain =
  ({ chainUuid, validate = false }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const { data: chain } = validate
      ? await axios.put(`/api/survey/${surveyId}/chain/validate`, { chainUuid })
      : await axios.get(`/api/survey/${surveyId}/chain/${chainUuid}`)

    dispatch({ type: ChainActionTypes.chainUpdate, chain })
    dispatch(LoaderActions.hideLoader())
  }
