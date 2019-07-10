import axios from 'axios'

import i18nFactory from '../../common/i18n/i18nFactory'
import * as CognitoAuth from './cognitoAuth'

import * as AppState from './appState'

export const appPropsChange = 'app/props/change'
export const appUserLogout = 'app/user/logout'
export const appUserPrefUpdate = 'app/user/pref/update'
export const appSideBarOpenedUpdate = 'app/sideBar/opened/update'

const getUserSurvey = async () => {
  const { data: { user, survey } } = await axios.get('/auth/user')
  return { user, survey }
}

export const initApp = () => async dispatch => {
  const i18n = await i18nFactory.createI18nPromise('en')

  let user = null
  let survey = null

  //get jwt token to check if user is already logged in
  const token = await CognitoAuth.getJwtToken()
  if (token) {
    const userSurvey = await getUserSurvey()
    user = userSurvey.user
    survey = userSurvey.survey
  }

  dispatch({ type: appPropsChange, status: AppState.appStatus.ready, i18n, user, survey })
}

export const initUser = () => async dispatch => {
  const { user, survey } = await getUserSurvey()
  dispatch({ type: appPropsChange, user, survey })
}

export const setLanguage = languageCode => async (dispatch) => {
  const i18n = await i18nFactory.createI18nPromise(languageCode)
  dispatch({ type: appPropsChange, i18n })
}

export const logout = () => async dispatch => {
  await axios.post('/auth/logout')
  await CognitoAuth.logout()
  dispatch({ type: appUserLogout })
}

// ====== Toggle sidebar
export const toggleSideBar = () => (dispatch, getState) => {
  const sideBarOpened = !AppState.isSideBarOpened(getState())
  dispatch({ type: appSideBarOpenedUpdate, [AppState.keys.sideBarOpened]: sideBarOpened })
}

// ====== ERRORS HANDLING

export const appErrorCreate = 'app/error/create'
export const appErrorDelete = 'app/error/delete'

export const closeAppError = error => dispatch =>
  dispatch({ type: appErrorDelete, error })

export const systemErrorThrow = 'system/error'

export const throwSystemError = error => dispatch =>
  dispatch({ type: systemErrorThrow, error })