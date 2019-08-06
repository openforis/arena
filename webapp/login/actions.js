import axios from 'axios'

import * as CognitoAuth from '../app/cognitoAuth'

import { userActions } from './loginState'
import { hideAppLoader, initUser, showAppLoader } from '../app/actions'

export const setRequiredUserAction = 'login/setRequiredUserAction'
export const loginError = 'login/error'

const getAction = (cognitoFn, cognitoResponseHandler) => (username, password) =>
  async dispatch => {
    try {
      dispatch(showAppLoader())
      dispatch(setLoginError(null))

      const { type } = await cognitoFn(username, password)
      const action = await cognitoResponseHandler(type, { username })

      if (action) dispatch(action)
      if (type === 'success') dispatch(initUser())
    } catch (error) {
      dispatch(setLoginError(error.message))
    } finally {
      dispatch(hideAppLoader())
    }
  }

export const login = getAction(
  CognitoAuth.login,
  cognitoResponseType => {
    if (cognitoResponseType === 'newPasswordRequired') {
      return { type: setRequiredUserAction, action: userActions.setNewPassword }
    }
  })

export const acceptInvitation = getAction(
  CognitoAuth.acceptInvitation,
  async (cognitoResponseType, { username }) => {
    if (cognitoResponseType === 'success') {
      await axios.put('/api/user/username', { name: username })
      return { type: setRequiredUserAction, action: userActions.login }
    }
  })

export const setLoginError = message => dispatch =>
  dispatch({ type: loginError, message })
