import axios from 'axios'

import User from '../../core/user/user'
import i18nFactory from '../../core/i18n/i18nFactory'
import Counter from '../../core/counter'

import * as CognitoAuth from './cognitoAuth'

import * as AppState from './appState'

export const appPropsChange = 'app/props/change'
export const appUserLogout = 'app/user/logout'

export const systemErrorThrow = 'system/error'

export const throwSystemError = error => dispatch => dispatch({ type: systemErrorThrow, error })

// ====== INIT

export const initApp = () => async dispatch => {
  const i18n = await i18nFactory.createI18nPromise('en')
  let user = null
  let survey = null

  //get jwt token to check if user is already logged in
  try {
    const token = await CognitoAuth.getJwtToken()
    if (token) {
      const userSurvey = await getUserSurvey()
      user = userSurvey.user
      survey = userSurvey.survey
    }
    dispatch({ type: appPropsChange, status: AppState.appStatus.ready, i18n, user, survey })
  } catch (e) {
    dispatch({ type: appPropsChange, i18n })
    dispatch(throwSystemError(e.message))
  }
}

// ====== USER

const getUserSurvey = async () => {
  const { data: { user, survey } } = await axios.get('/auth/user')
  return { user, survey }
}

export const initUser = () => async dispatch => {
  const { user, survey } = await getUserSurvey()
  dispatch({ type: appPropsChange, user, survey })
}

export const setUser = user => async dispatch => {
  dispatch({ type: appPropsChange, user })
}

export const updateUserPrefs = user => async dispatch => {
  dispatch(setUser(user))
  await axios.post(`/api/user/${User.getUuid(user)}/prefs`, user)
}

export const logout = () => async dispatch => {
  dispatch(showAppLoader())

  await axios.post('/auth/logout')
  CognitoAuth.logout()

  dispatch({ type: appUserLogout })
  dispatch(hideAppLoader())
}

// ====== SAVING
export const appSavingUpdate = 'app/saving/update'

const appSavingCounter = new Counter()

export const showAppSaving = () => dispatch => {
  if (appSavingCounter.count === 0) {
    dispatch({ type: appSavingUpdate, saving: true })
  }
  appSavingCounter.increment()
}

export const hideAppSaving = () => dispatch => {
  appSavingCounter.decrement()
  if (appSavingCounter.count === 0) {
    dispatch({ type: appSavingUpdate, saving: false })
  }
}

// ====== APP LOADER

export const showAppLoader = () => dispatch => dispatch({ type: appPropsChange, [AppState.keys.loaderVisible]: true })

export const hideAppLoader = () => dispatch => dispatch({ type: appPropsChange, [AppState.keys.loaderVisible]: false })
