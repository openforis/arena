import axios from 'axios'

import i18nFactory from '../../common/i18n/i18nFactory'
import * as CognitoAuth from './cognitoAuth'

import * as AppState from './appState'
import { cancelDebouncedAction, debounceAction } from '../utils/reduxUtils'

export const appPropsChange = 'app/props/change'
export const appUserLogout = 'app/user/logout'
export const appUserPrefUpdate = 'app/user/pref/update'

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
    dispatch({ type: appPropsChange, i18n, })
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

export const setLanguage = languageCode => async (dispatch) => {
  const i18n = await i18nFactory.createI18nPromise(languageCode)
  dispatch({ type: appPropsChange, i18n })
}

export const logout = () => async dispatch => {
  dispatch(showAppLoader())

  await axios.post('/auth/logout')
  CognitoAuth.logout()

  dispatch({ type: appUserLogout })
  dispatch(hideAppLoader())
}

// ====== SIDEBAR

export const appSideBarOpenedUpdate = 'app/sideBar/opened/update'

export const toggleSideBar = () => (dispatch, getState) => {
  const sideBarOpened = !AppState.isSideBarOpened(getState())
  dispatch({ type: appSideBarOpenedUpdate, [AppState.keys.sideBarOpened]: sideBarOpened })
}

// ====== ERRORS HANDLING

export const appErrorCreate = 'app/error/create'
export const appErrorDelete = 'app/error/delete'
export const systemErrorThrow = 'system/error'

export const closeAppError = error => dispatch => dispatch({ type: appErrorDelete, error })

export const throwSystemError = error => dispatch => dispatch({ type: systemErrorThrow, error })

// ====== APP LOADER

export const showAppLoader = () => dispatch => dispatch({ type: appPropsChange, [AppState.keys.loaderVisible]: true })

export const hideAppLoader = () => dispatch => dispatch({ type: appPropsChange, [AppState.keys.loaderVisible]: false })

// ====== APP JOB

export const appJobStart = 'app/job/start'
export const appJobActiveUpdate = 'app/job/active/update'

export const showAppJobMonitor = (job, onComplete = null, autoHide = false) => dispatch =>
  dispatch({ type: appJobStart, job, onComplete, autoHide })

export const hideAppJobMonitor = () => dispatch => dispatch(activeJobUpdate(null))

export const cancelActiveJob = () => async dispatch => {
  await axios.delete(`/api/jobs/active`)
  dispatch(hideAppJobMonitor())
}

export const activeJobUpdate = job => (dispatch, getState) => {
  if (job && job.succeeded) {
    const onComplete = AppState.getActiveJobOnCompleteCallback(getState())
    if (onComplete) {
      onComplete(job)
    }
  }
  dispatch({ type: appJobActiveUpdate, job })
}

// ====== APP Notification
export const appNotificationShow = 'app/notification/show'
export const appNotificationHide = 'app/notification/hide'

export const showNotificationMessage = (messageKey, messageParams, severity) => dispatch => {
  dispatch({
    type: appNotificationShow,
    notification: {
      [AppState.keysNotification.messageKey]: messageKey,
      [AppState.keysNotification.messageParams]: messageParams,
      [AppState.keysNotification.severity]: severity,
    }
  })

  dispatch(debounceAction({ type: appNotificationHide }, appNotificationHide, 10000))
}

export const hideNotification = () => dispatch => {
  dispatch(cancelDebouncedAction(appNotificationHide))
  dispatch({ type: appNotificationHide })
}