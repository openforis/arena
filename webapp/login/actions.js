import axios from 'axios'

import * as CognitoAuth from '../app/cognitoAuth'

import * as LoginState from './loginState'
import { hideAppLoader, initUser, showAppLoader, showNotificationMessage } from '../app/actions'

export const loginUserActionUpdate = 'login/userAction/update'
export const loginErrorUpdate = 'login/error'

export const setLoginError = message => dispatch => dispatch({ type: loginErrorUpdate, message })

const _createAction = cognitoResponseHandler => async dispatch => {
  try {
    dispatch(showAppLoader())
    dispatch(setLoginError(null))

    await cognitoResponseHandler(dispatch)
  } catch (error) {
    dispatch(setLoginError(error.message))
  } finally {
    dispatch(hideAppLoader())
  }
}

export const login = (email, password) => _createAction(
  async dispatch => {
    const responseType = await CognitoAuth.login(email, password)

    if (responseType === CognitoAuth.keysAction.success) {
      dispatch(initUser())
    } else if (responseType === CognitoAuth.keysAction.newPasswordRequired) {
      dispatch({ type: loginUserActionUpdate, action: LoginState.userActions.setNewPassword })
    }
  }
)

export const acceptInvitation = (name, password) => _createAction(
  async dispatch => {
    const responseType = await CognitoAuth.acceptInvitation(name, password)

    if (responseType === CognitoAuth.keysAction.success) {
      const cognitoUser = CognitoAuth.getUser()
      await axios.put(`/api/user/${cognitoUser.username}/name`, { name })
      dispatch({ type: loginUserActionUpdate, action: LoginState.userActions.login })
      dispatch(initUser())
    }
  }
)

export const showForgotPasswordForm = () => dispatch => {
  dispatch(setLoginError(null))
  dispatch({ type: loginUserActionUpdate, action: LoginState.userActions.resetPasswordRequest })
}

export const sendResetPasswordRequest = email => _createAction(
  async dispatch => {
    const responseType = await CognitoAuth.forgotPassword(email)
    if (responseType === CognitoAuth.keysAction.success) {
      dispatch(showNotificationMessage('An email with the verification code has been sent'))
    }
  }
)

export const showResetPasswordForm = () => dispatch => {
  dispatch(setLoginError(null))
  dispatch({ type: loginUserActionUpdate, action: LoginState.userActions.resetPassword })
}

export const resetPassword = (username, verificationCode, newPassword) => _createAction(
  async dispatch => {
    const responseType = await CognitoAuth.resetPassword(username, verificationCode, newPassword)
    console.log(responseType)
  }
)