import * as R from 'ramda'
import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'

import { getSurvey } from '../surveyState'
import { getSurveyId, assocSurveyProp, assocSurveyPropValidation } from '../../../common/survey/survey'

import { dispatchCurrentSurveyPropUpdate, surveyCurrentPropUpdate } from '../actions'

export const updateSurveyProp = (key, value) => async (dispatch, getState) => {

  const survey = R.pipe(
    getSurvey,
    assocSurveyProp(key, value),
    assocSurveyPropValidation(key, null)
  )(getState())

  dispatchCurrentSurveyPropUpdate(dispatch, survey)
  dispatch(_updateSurveyProp(survey, key, value))
}

const _updateSurveyProp = (survey, key, value) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/survey/${getSurveyId(survey)}/prop`, {key, value})

      const {validation} = res.data

      const updatedSurvey = assocSurveyPropValidation(key, validation)(survey)

      dispatchCurrentSurveyPropUpdate(dispatch, updatedSurvey)
    } catch (e) {}
  }

  return debounceAction(action, `${surveyCurrentPropUpdate}_${key}`)
}