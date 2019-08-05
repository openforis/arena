import axios from 'axios'

import * as CognitoAuth from '../app/cognitoAuth'

import * as LoginState from './loginState'
import { hideAppLoader, initUser, showAppLoader } from '../app/actions'

export const passwordResetUser = 'login/passwordResetUser'
export const loginError = 'login/error'
export const loginErrorReset = 'login/reset'
export const passwordResetUserReset = 'login/passwordResetUserReset'

export const login = (username, password) => async dispatch => {
  try {
    dispatch(showAppLoader())

    const cognitoLoginResult = await CognitoAuth.login(username, password)
    const { type } = cognitoLoginResult

    switch (type) {
    case 'success':
      dispatch({ type: loginErrorReset })
      dispatch(initUser())
      break
    case 'newPasswordRequired':
      dispatch({ type: loginErrorReset })
      const { user } = cognitoLoginResult
      dispatch({ type: passwordResetUser, user })
      break
    }
  } catch (error) {
    dispatch(setLoginError(error.message))
  } finally {
    dispatch(hideAppLoader())
  }
}

export const acceptInvitation = (password, name) =>
  async (dispatch, getState) => {
    try {
      dispatch({ type: loginErrorReset })
      dispatch(showAppLoader())

      const newUser = LoginState.getPasswordResetUser(getState())
      const response = await CognitoAuth.setNewUserPassword(password, { ...newUser, name })

      if (response.type === 'success') {
        await axios.put('/api/user/username', { name })

        dispatch({ type: passwordResetUserReset })
        dispatch(initUser())
      }
    } catch (error) {
      dispatch(setLoginError(error.message))
    } finally {
      dispatch(hideAppLoader())
    }
  }

export const setLoginError = message => dispatch =>
  dispatch({ type: loginError, message })
