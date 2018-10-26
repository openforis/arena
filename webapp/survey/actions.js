import axios from 'axios'
import * as R from 'ramda'

import { assocSurveyProp, assocSurveyPropValidation } from '../../common/survey/survey'

import { getSurvey, getSurveyId } from './surveyState'

import { debounceAction } from '../appUtils/reduxUtils'

export const surveyCurrentUpdate = 'survey/current/update'

export const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({type: surveyCurrentUpdate, survey})

export const dispatchMarkCurrentSurveyDraft = (dispatch, getState) => {

  const survey = R.pipe(getSurvey,
    R.assoc('draft', true)
  )(getState())

  dispatchCurrentSurveyUpdate(dispatch, survey)
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

  dispatchCurrentSurveyUpdate(dispatch, survey)
  dispatch(_updateSurveyProp(survey, key, value))
}

const _updateSurveyProp = (survey, key, value) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${survey.id}/prop`, {key, value})

      const {validation} = res.data

      const updatedSurvey = assocSurveyPropValidation(key, validation)(survey)

      dispatchCurrentSurveyUpdate(dispatch, updatedSurvey)
    } catch (e) {}
  }

  return debounceAction(action, `${surveyCurrentUpdate}_${key}`)
}

export const publishSurvey = () => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const {data} = await axios.put(`/api/survey/${survey.id}/publish`)

  dispatchCurrentSurveyUpdate(dispatch, data.survey)
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