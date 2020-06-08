import axios from 'axios'

import * as User from '@core/user/user'
import * as i18nFactory from '@core/i18n/i18nFactory'
import Counter from '@core/counter'

import { LoaderActions } from '@webapp/store/ui'

import * as AppState from './appState'

export const appPropsChange = 'app/props/change'
export const appUserLogout = 'app/user/logout'

// ====== INIT

export const initApp = () => async (dispatch) => {
  const i18n = await i18nFactory.createI18nPromise('en')
  const { user, survey } = await _fetchUserAndSurvey()
  dispatch({
    type: appPropsChange,
    status: AppState.appStatus.ready,
    i18n,
    user,
    survey,
  })
}

// ====== USER

const _fetchUserAndSurvey = async () => {
  const {
    data: { user, survey },
  } = await axios.get('/auth/user')
  return { user, survey }
}

export const initUser = () => async (dispatch) => {
  const { user, survey } = await _fetchUserAndSurvey()
  dispatch({ type: appPropsChange, user, survey })
}

export const setUser = (user) => async (dispatch) => {
  dispatch({ type: appPropsChange, user })
}

export const updateUserPrefs = (user) => async (dispatch) => {
  dispatch(setUser(user))
  await axios.post(`/api/user/${User.getUuid(user)}/prefs`, user)
}

export const logout = () => async (dispatch) => {
  dispatch(LoaderActions.showLoader())

  await axios.post('/auth/logout')

  dispatch({ type: appUserLogout })
  dispatch(LoaderActions.hideLoader())
}

// ====== SAVING
export const appSavingUpdate = 'app/saving/update'

const appSavingCounter = new Counter()

export const showAppSaving = () => (dispatch) => {
  if (appSavingCounter.count === 0) {
    dispatch({ type: appSavingUpdate, saving: true })
  }

  appSavingCounter.increment()
}

export const hideAppSaving = () => (dispatch) => {
  appSavingCounter.decrement()
  if (appSavingCounter.count === 0) {
    dispatch({ type: appSavingUpdate, saving: false })
  }
}
