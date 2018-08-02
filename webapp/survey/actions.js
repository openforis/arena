import axios from 'axios'
import * as R from 'ramda'

import { setSurveyProp } from '../../common/survey/survey'

import { getCurrentSurvey, getCurrentSurveyId, getNewSurvey } from './surveyState'
import { nodeDefsFetch } from './nodeDefActions'

export const surveyCurrentUpdate = 'survey/current/update'
export const surveyNewUpdate = 'survey/new/update'

export const dispatchCurrentSurveyUpdate = (dispatch, survey) =>
  dispatch({type: surveyCurrentUpdate, survey})

// ====== CREATE

export const updateNewSurveyProp = (name, value) => (dispatch, getState) => {

  const newSurvey = R.pipe(
    getNewSurvey,
    R.dissocPath(['validation', 'fields', name]),
    R.assoc(name, value),
  )(getState())

  dispatch({type: surveyNewUpdate, newSurvey})

}

export const createSurvey = surveyProps => async (dispatch, getState) => {
  try {
    const {data} = await axios.post('/api/survey', surveyProps)

    const {survey} = data
    const valid = !!survey

    if (valid) {
      dispatchCurrentSurveyUpdate(dispatch, survey)
      dispatch(resetNewSurvey())
    } else {
      dispatch({
        type: surveyNewUpdate,
        newSurvey: {
          ...getNewSurvey(getState()),
          ...data,
        }
      })

    }

  } catch (e) {

  }
}

export const resetNewSurvey = () => dispatch => dispatch({type: surveyNewUpdate, newSurvey: null})

// ==== READ

export const fetchRootNodeDef = (draft = false) => async (dispatch, getState) => {
  try {
    const surveyId = getCurrentSurveyId(getState())
    const {data} = await axios.get(`/api/survey/${surveyId}/rootNodeDef?draft=${draft}`)
    dispatch({type: nodeDefsFetch, ...data})

  } catch (e) { }
}

// ==== UPDATE

export const updateSurveyProp = (key, value) => async (dispatch, getState) => {

  const survey = R.pipe(
    getCurrentSurvey,
    setSurveyProp(key, value),
  )(getState())

  dispatchCurrentSurveyUpdate(dispatch, survey)

  try {
    await axios.put(`/api/survey/${survey.id}/prop`, {key, value})
  } catch (e) {

  }
}