import axios from 'axios'

import * as Validation from '@core/validation/validation'

import * as LoginState from './loginState'
import * as AppState from '@webapp/app/appState'
import { hideAppLoader, initUser, showAppLoader } from '../app/actions'

export const loginEmailUpdate = 'login/email/update'
export const loginUserActionUpdate = 'login/userAction/update'
export const loginErrorUpdate = 'login/error'

export const setEmail = email => dispatch => dispatch({ type: loginEmailUpdate, email })

export const setLoginError = message => dispatch => dispatch({ type: loginErrorUpdate, message })

const _createAction = handlerFn => async (dispatch, getState) => {
  try {
    dispatch(showAppLoader())
    dispatch(setLoginError(null))

    await handlerFn(dispatch, getState)
  } catch (error) {
    dispatch(setLoginError(Validation.messageKeys.user[error.code]))
  } finally {
    dispatch(hideAppLoader())
  }
}

export const login = (email, password) =>
  _createAction(async (dispatch, getState) => {
    const {
      data: { message, user },
    } = await axios.post('/auth/login', { email, password })

    if (user) {
      dispatch(setEmail(''))
      dispatch(initUser())
    } else {
      const i18n = AppState.getI18n(getState())
      dispatch(setLoginError(i18n.t(message)))
    }
  })

export const acceptInvitation = (name, password) =>
  _createAction(async dispatch => {
    /* TODO
    const responseType = await CognitoAuth.acceptInvitation(name, password)

    if (responseType === CognitoAuth.keysAction.success) {
      const cognitoUser = CognitoAuth.getUser()
      await axios.put(`/api/user/${cognitoUser.username}/accept-invitation`, {
        name,
      })
      dispatch(setEmail(''))
      dispatch({
        type: loginUserActionUpdate,
        action: LoginState.userActions.login,
      })
      dispatch(initUser())
    }
    */
  })

export const showForgotPasswordForm = () => dispatch => {
  dispatch(setLoginError(null))
  dispatch({
    type: loginUserActionUpdate,
    action: LoginState.userActions.forgotPassword,
  })
}

export const sendVerificationCode = email =>
  _createAction(async dispatch => {
    /* TODO
    const responseType = await CognitoAuth.forgotPassword(email)
    if (responseType === CognitoAuth.keysAction.success) {
      dispatch(showNotification('An email with the verification code has been sent'))
      dispatch({
        type: loginUserActionUpdate,
        action: LoginState.userActions.resetPassword,
      })
    }
    */
  })

export const resetPassword = (verificationCode, newPassword) =>
  _createAction(async dispatch => {
    /* TODO
    const responseType = await CognitoAuth.resetPassword(verificationCode, newPassword)
    if (responseType === CognitoAuth.keysAction.success) {
      dispatch(setEmail(''))
      dispatch(showNotification('Your password has been reset'))
      dispatch({
        type: loginUserActionUpdate,
        action: LoginState.userActions.login,
      })
    }
    */
  })
