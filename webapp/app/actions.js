import axios from 'axios'

import * as AppState from './appState'

import i18nFactory from '../../common/i18n/i18nFactory'

export const appStatusChange = 'app/status/change'
export const appUserLogout = 'app/user/logout'
export const appUserPrefUpdate = 'app/user/pref/update'

export const initApp = () => async (dispatch) => {
  // fetching user
  const resp = await axios.get('/auth/user')

  const { data } = resp
  const { user, survey } = data

  dispatch(setLanguage('en'))
  dispatch({ type: appStatusChange, status: AppState.appStatus.ready, user, survey })
}

export const setLanguage = languageCode => async (dispatch) => {
  const i18n = await i18nFactory.createI18nPromise(languageCode)
  dispatch({ type: appStatusChange, i18n })
}

export const logout = () => async dispatch => {
  await axios.post('/auth/logout')
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