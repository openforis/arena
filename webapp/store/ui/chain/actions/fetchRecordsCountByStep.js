import { LoaderActions } from '@webapp/store/ui/loader'
import { SurveyState } from '@webapp/store/survey'

import * as API from '@webapp/service/api'

import { ChainActionTypes } from './actionTypes'

export const fetchRecordsCountByStep = async (dispatch, getState) => {
  dispatch(LoaderActions.showLoader())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const recordsCountByStep = await API.fetchRecordsCountByStep({ surveyId })

  dispatch({ type: ChainActionTypes.chainRecordsCountUpdate, recordsCountByStep })

  dispatch(LoaderActions.hideLoader())
}
