import axios from 'axios'
import * as R from 'ramda'

import { surveyState } from './surveyState'

export const newSurveyUpdate = 'survey/new/update'

export const updateNewSurveyProp = (name, value) => (dispatch, getState) => {

  const newSurvey = R.pipe(
    surveyState.getNewSurvey,
    R.dissocPath(['validation', 'fields', name]),
    R.assoc(name, value),
  )(getState())

  dispatch({type: newSurveyUpdate, newSurvey})

}

export const createSurvey = survey => async (dispatch, getState) => {
  try {

    const {data} = await axios.post('/api/survey', survey)

    const newSurvey = {
      ...surveyState.getNewSurvey(getState()),
      ...data,
    }

    dispatch({type: newSurveyUpdate, newSurvey})

  } catch (e) {

  }

}
