import axios from 'axios'
import * as R from 'ramda'

import { assocSurveyProp, assocSurveyPropValidation } from '../../common/survey/survey'

import { getSurvey, getSurveyId } from './surveyState'
import { nodeDefUpdate } from './nodeDef/actions'
import { debounceAction } from '../appUtils/reduxUtils'

export const surveyCurrentUpdate = 'survey/current/update'

export const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({type: surveyCurrentUpdate, survey})

// ==== READ

export const fetchRootNodeDef = (draft = false) => async (dispatch, getState) => {
  try {
    const surveyId = getSurveyId(getState())
    const {data} = await axios.get(`/api/survey/${surveyId}/rootNodeDef?draft=${draft}`)
    dispatch({type: nodeDefUpdate, ...data})

  } catch (e) { }
}

// ==== UPDATE

export const updateSurveyProp = (key, value) => async (dispatch, getState) => {

  const survey = R.pipe(
    getSurvey,
    assocSurveyProp(key, value),
    assocSurveyPropValidation(key, null)
  )(getState())

  dispatchCurrentSurveyUpdate(dispatch, survey)
  dispatch(_updateSurveyProp(survey, key, value))
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

