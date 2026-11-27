import axios from 'axios'

import { AppInfo } from '@core/app/appInfo'
import * as ProcessUtils from '@core/processUtils'
import { appModules, appModuleUri } from '@webapp/app/appModules'
import { SystemActions } from '@webapp/store/system'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'

import { authSession } from './authSession'
import * as LoginState from './state'
import { ViewState } from './state'

export const loginEmailUpdate = 'login/email/update'
export const loginErrorUpdate = 'login/error'
export const loginViewStateUpdate = 'login/viewState/update'
export const reset = 'login/reset'
export const loginExternalLoginUpdate = 'login/externalLogin/update'

export const setEmail = (email) => (dispatch) => dispatch({ type: loginEmailUpdate, email })
export const setLoginError = (message) => (dispatch) => dispatch({ type: loginErrorUpdate, message })
export const setViewState = (viewState) => (dispatch) => dispatch({ type: loginViewStateUpdate, viewState })
export const setExternalLogin = (externalLogin) => (dispatch) =>
  dispatch({ type: loginExternalLoginUpdate, externalLogin })

const resetState = (dispatch) => dispatch({ type: reset })

const externalLoginErrorKeyPrefix = 'externalLogin.'

/**
 * Converts the error keys of the external login ("externalLogin.userNotFound") to i18n keys.
 * @param {string} errorKey - The error key returned by the server.
 * @returns {string} - The i18n key.
 */
export const toExternalLoginErrorMessageKey = (errorKey) => {
  let key = String(errorKey).replace(externalLoginErrorKeyPrefix, '')
  // with self-registration, new users create their account (instead of requesting access)
  if (key === 'userNotFound' && ProcessUtils.ENV.allowUserSelfRegistration) {
    key = 'userNotFoundCreateAccount'
  }
  return `guest:externalLogin.errors.${key}`
}

const toErrorMessageKey = (messageKey) =>
  messageKey?.startsWith(externalLoginErrorKeyPrefix) ? toExternalLoginErrorMessageKey(messageKey) : messageKey

const _createAction = (handlerFn) => async (dispatch, getState) => {
  try {
    dispatch(LoaderActions.showLoader())
    dispatch(setLoginError(null))

    await handlerFn(dispatch, getState)
  } catch (error) {
    // no message from the server (e.g. server unreachable): don't show technical details like "AxiosError: ..."
    const messageKey = toErrorMessageKey(error?.response?.data?.message) || 'appErrors:networkError'
    dispatch(setLoginError(messageKey))
  } finally {
    dispatch(LoaderActions.hideLoader())
  }
}

const postLogin = ({ email, password, twoFactorToken, externalLogin }) =>
  externalLogin
    ? // 2FA step of a sign-in with an external provider: the pending login is in a cookie set by the server
      axios.post('/auth/oidc/_2fa', { twoFactorToken, appInfo: AppInfo.currentAppInfo })
    : axios.post('/auth/login', { email, password, twoFactorToken, appInfo: AppInfo.currentAppInfo })

export const login = (email, password, twoFactorToken) =>
  _createAction(async (dispatch, getState) => {
    const externalLogin = LoginState.isExternalLogin(getState())
    const {
      data: { message, user, twoFactorRequired, authToken },
    } = await postLogin({ email, password, twoFactorToken, externalLogin })
    if (user) {
      await authSession.begin(authToken)
      dispatch(resetState)
      dispatch(SystemActions.initSystem())
    } else if (twoFactorRequired) {
      dispatch(setViewState(ViewState.ask2FAToken))
    } else {
      dispatch(setLoginError(message))
    }
  })

export const logout =
  ({ navigate }) =>
  async (dispatch) => {
    dispatch(LoaderActions.showLoader())

    // the conversations stay in this browser until the user clears them
    const { serverSessionEnded } = await authSession.end()
    dispatch(SystemActions.resetSystem())
    dispatch(LoaderActions.hideLoader())
    // the server session (a cookie) may still be active: on a shared computer the browser must be closed
    if (!serverSessionEnded) {
      dispatch(NotificationActions.notifyWarning({ key: 'common.logoutServerNotReached', autoHide: false }))
    }

    // navigate to home page
    navigate(appModuleUri(appModules.home))
  }

export const sendPasswordResetEmail = (email, navigate) =>
  _createAction(async (dispatch) => {
    const {
      data: { error },
    } = await axios.post('/auth/reset-password', { email })

    if (error) {
      dispatch(setLoginError(error))
    } else {
      dispatch(NotificationActions.notifyInfo({ key: 'common.emailSentToSelfConfirmation', params: { email } }))
      navigate(-1)
    }
  })
