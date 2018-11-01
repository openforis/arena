import axios from 'axios'

import { getStateSurveyId } from './surveyState'

export const surveyCreate = 'survey/create'
export const surveyUpdate = 'survey/update'
export const surveyPublish = 'survey/publish'

export const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({type: surveyUpdate, survey})

// ==== UPDATE

export const publishSurvey = () => async (dispatch, getState) => {
  dispatch({type: surveyPublish})

  const surveyId = getStateSurveyId(getState())
  await axios.put(`/api/survey/${surveyId}/publish`)
}

// == DELETE

export const deleteSurvey = () => async (dispatch, getState) => {
  dispatchCurrentSurveyUpdate(dispatch, null)

  const surveyId = getStateSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}`)
}