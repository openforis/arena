import axios from 'axios'
import * as R from 'ramda'

import { getStateSurveyId, getSurvey } from './surveyState'

export const surveyCreate = 'survey/create'
export const surveyUpdate = 'survey/update'
export const surveyPublish = 'survey/publish'

export const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({type: surveyUpdate, survey})

//TODO REMOVE
export const dispatchMarkCurrentSurveyDraft = (dispatch, getState) => {
  const survey = R.pipe(getSurvey,
    R.assoc('draft', true)
  )(getState())

  // dispatchSurveyInfoPropUpdate(dispatch, survey)
}

// ==== READ

// ==== UPDATE

export const publishSurvey = () => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())

  await axios.put(`/api/survey/${surveyId}/publish`)

  dispatch({type: surveyPublish})
}

// == DELETE

export const deleteSurvey = () => async (dispatch, getState) => {
  try {
    const surveyId = getStateSurveyId(getState())
    await axios.delete(`/api/survey/${surveyId}`)
    dispatchCurrentSurveyUpdate(dispatch, null)
  } catch (e) {

  }
}