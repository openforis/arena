import axios from 'axios'
import * as R from 'ramda'

import { assocSurveyProp, assocSurveyPropValidation } from '../../common/survey/survey'

import { getSurvey, getSurveyId } from './surveyState'

import { debounceAction } from '../appUtils/reduxUtils'

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

export const updateSurveyProp = (key, value) => async (dispatch, getState) => {

  const survey = R.pipe(
    getSurvey,
    assocSurveyProp(key, value),
    R.assoc('draft', true),
    assocSurveyPropValidation(key, null)
  )(getState())

  dispatchCurrentSurveyPropUpdate(dispatch, survey)
  dispatch(_updateSurveyProp(survey, key, value))
}

const _updateSurveyProp = (survey, key, value) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${survey.id}/prop`, {key, value})

      const {validation} = res.data

      const updatedSurvey = assocSurveyPropValidation(key, validation)(survey)

      dispatchCurrentSurveyPropUpdate(dispatch, updatedSurvey)
    } catch (e) {}
  }

  return debounceAction(action, `${surveyCurrentUpdate}_${key}`)
}

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