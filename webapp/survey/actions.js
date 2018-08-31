import axios from 'axios'
import * as R from 'ramda'

import { setSurveyProp } from '../../common/survey/survey'

import { getCurrentSurvey, getCurrentSurveyId, getNewSurvey, assocSurveyPropValidation } from './surveyState'
import { nodeDefUpdate } from './nodeDef/actions'
import { debounceAction } from '../appUtils/reduxUtils'

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
    dispatch({type: nodeDefUpdate, ...data})

  } catch (e) { }
}

// ==== UPDATE

export const updateSurveyProp = (key, value) => async (dispatch, getState) => {

  const survey = R.pipe(
    getCurrentSurvey,
    setSurveyProp(key, value),
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
