import axios from 'axios'
import * as R from 'ramda'

import { surveyState } from './surveyState'

export const surveyCurrentUpdate = 'survey/current/update'
export const surveyNewUpdate = 'survey/new/update'

// == CREATE
export const updateNewSurveyProp = (name, value) => (dispatch, getState) => {

  const newSurvey = R.pipe(
    surveyState.getNewSurvey,
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

    const newSurvey = valid
      ? null
      : {
        ...surveyState.getNewSurvey(getState()),
        ...data,
      }

    dispatch({type: surveyNewUpdate, newSurvey})

    if (valid) {
      dispatch({type: surveyCurrentUpdate, current: survey})
    }

  } catch (e) {

  }

}

export const resetNewSurvey = () => dispatch => dispatch({type: surveyNewUpdate, newSurvey: null})