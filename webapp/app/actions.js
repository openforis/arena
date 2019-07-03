import axios from 'axios'

import * as AppState from './appState'

import i18nFactory from '../../common/i18n/i18nFactory'

import * as CognitoAuth from '../utils/cognitoAuth'

export const appStatusChange = 'app/status/change'
export const appUserLogout = 'app/user/logout'
export const appUserPrefUpdate = 'app/user/pref/update'

export const initApp = () => async (dispatch, getState) => {
  const i18n = await i18nFactory.createI18nPromise('en')

  dispatch(initUser())
  dispatch({ type: appStatusChange, status: AppState.appStatus.ready, i18n })
}

export const initUser = () => async (dispatch, getState) => {
  const { data: { user, survey } } = await axios.get('/auth/user')
  dispatch({ type: appStatusChange, user, survey })
}

export const setLanguage = languageCode => async (dispatch) => {
  const i18n = await i18nFactory.createI18nPromise(languageCode)
  dispatch({ type: appStatusChange, i18n })
}

export const logout = () => async dispatch => {
  await CognitoAuth.logout()
  // await axios.post('/auth/logout')
  dispatch({ type: appUserLogout })
}

// ====== ERRORS HANDLING

export const appErrorCreate = 'app/error/create'
export const appErrorDelete = 'app/error/delete'

export const closeAppError = error => dispatch =>
  dispatch({ type: appErrorDelete, error })

export const systemErrorThrow = 'system/error'

export const throwSystemError = error => dispatch =>
  dispatch({ type: systemErrorThrow, error })