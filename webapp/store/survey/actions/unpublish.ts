import axios from 'axios'

import * as SurveyState from '../state'
import { waitForJobAndSetActiveSurvey } from './surveyActionsCommon'

export const unpublishSurvey = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const { data } = await axios.put(`/api/survey/${surveyId}/unpublish`)
  const { job } = data
  waitForJobAndSetActiveSurvey({ dispatch, getState, job })
}
