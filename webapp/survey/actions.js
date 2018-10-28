import axios from 'axios'
import * as R from 'ramda'

import { getSurvey, getSurveyId } from './surveyState'

export const surveyCurrentUpdate = 'survey/current/update'
export const surveyCurrentPropUpdate = 'survey/current/prop/update'

export const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({type: surveyCurrentUpdate, survey})

export const dispatchCurrentSurveyPropUpdate = (dispatch, survey) =>
  dispatch({type: surveyCurrentPropUpdate, survey})


export const dispatchMarkCurrentSurveyDraft = (dispatch, getState) => {
  const survey = R.pipe(getSurvey,
    R.assoc('draft', true)
  )(getState())

  dispatchCurrentSurveyPropUpdate(dispatch, survey)
}

// ==== READ

// ==== UPDATE

export const publishSurvey = () => async (dispatch, getState) => {
  const surveyId = getSurveyId(getState())

  const {data} = await axios.put(`/api/survey/${surveyId}/publish`)

  dispatchCurrentSurveyPropUpdate(dispatch, data.survey)
}


// == DELETE

export const deleteSurvey = () => async (dispatch, getState) => {
  try {
    const surveyId = getSurveyId(getState())
    await axios.delete(`/api/survey/${surveyId}`)
    dispatchCurrentSurveyUpdate(dispatch, null)
  } catch (e) {

  }
}