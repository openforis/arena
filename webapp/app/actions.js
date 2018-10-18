import axios from 'axios'

import { appState, systemStatus } from './app'
import { userPrefNames } from '../../common/user/userPrefs'

import { dispatchCurrentSurveyUpdate } from '../survey/actions'
import { fetchSurveyActiveJob } from '../survey/job/actions'

export const appStatusChange = 'app/status/change'
export const appUserLogout = 'app/user/logout'
export const appUserPrefUpdate = 'app/user/pref/update'

let surveyActiveJobPollingInterval = null

export const initApp = () => async (dispatch) => {
  try {

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
    //stop survey active job polling
    clearInterval(surveyActiveJobPollingInterval)
    surveyActiveJobPollingInterval = null

    await axios.post('/auth/logout')

    dispatch({type: appUserLogout})
  } catch (e) {
  }

}

// List of surveys available to current user
export const appSurveysUpdate = 'app/surveys/update'

export const fetchSurveys = () => async dispatch => {
  try {
    const {data} = await axios.get('/api/surveys')

    dispatch({type: appSurveysUpdate, surveys: data.surveys})
  } catch (e) {
  }
}

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

export const startAppJobMonitoring = () =>
  dispatch =>
    surveyActiveJobPollingInterval = setInterval(
      () => dispatch(fetchSurveyActiveJob()),
      3000
    )

