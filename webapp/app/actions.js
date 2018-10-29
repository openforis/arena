import * as R from 'ramda'
import axios from 'axios'

import { appState, systemStatus } from './app'
import { getNewSurvey } from './appState'
import { userPrefNames } from '../../common/user/userPrefs'

import { dispatchCurrentSurveyUpdate } from '../survey/actions'
import { stopAppJobMonitoring } from './components/job/actions'

export const appErrorCreate = 'app/error/create'

export const appStatusChange = 'app/status/change'
export const appUserLogout = 'app/user/logout'
export const appUserPrefUpdate = 'app/user/pref/update'
export const appNewSurveyUpdate = 'app/newSurvey/update'

export const initApp = () => async (dispatch) => {
  try {

    // global ajax errors handling
    axios.interceptors.response.use(null, (error) => {
      dispatch({type: appErrorCreate, error: {...error, message: error.message}})
    })


    // fetching user
    const resp = await axios.get('/auth/user')

    const {data} = resp
    const {user, survey} = data

    if (survey)
      dispatchCurrentSurveyUpdate(dispatch, survey)

    dispatch({type: appStatusChange, status: systemStatus.ready, user})

  } catch (e) {
  }

}

export const logout = () => async dispatch => {
  try {
    dispatch(stopAppJobMonitoring())

    await axios.post('/auth/logout')

    dispatch({type: appUserLogout})
  } catch (e) {
  }
}

// ====== CREATE SURVEY

export const updateNewSurveyProp = (name, value) => (dispatch, getState) => {

  const newSurvey = R.pipe(
    getNewSurvey,
    R.dissocPath(['validation', 'fields', name]),
    R.assoc(name, value),
  )(getState())

  dispatch({type: appNewSurveyUpdate, newSurvey})

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
        type: appNewSurveyUpdate,
        newSurvey: {
          ...getNewSurvey(getState()),
          ...data,
        }
      })

    }

  } catch (e) {

  }
}

export const resetNewSurvey = () => dispatch =>
  dispatch({type: appNewSurveyUpdate, newSurvey: null})

// ====== SURVEYS LIST
export const appSurveysUpdate = 'app/surveys/update'

export const fetchSurveys = () => async dispatch => {
  try {
    const {data} = await axios.get('/api/surveys')

    dispatch({type: appSurveysUpdate, surveys: data.surveys})
  } catch (e) {
  }
}

// ====== LOAD SURVEY PROP
export const setActiveSurvey = surveyId =>
  async (dispatch, getState) => {
    try {

      //load survey
      const {data} = await axios.get(`/api/survey/${surveyId}?draft=true`)
      dispatchCurrentSurveyUpdate(dispatch, data.survey)

      //update userPref
      const user = appState.getUser(getState())
      await axios.post(`/api/user/${user.id}/pref/${userPrefNames.survey}/${surveyId}`)
      dispatch({type: appUserPrefUpdate, name: userPrefNames.survey, value: surveyId})

    } catch (e) {
    }
  }

