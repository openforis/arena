import axios from 'axios'

import * as CognitoAuth from '../app/cognitoAuth'

import * as LoginState from './loginState'
import { hideAppLoader, initUser, showAppLoader } from '../app/actions'

export const loginUserActionUpdate = 'login/userAction/update'
export const loginErrorUpdate = 'login/error'

export const setLoginError = message => dispatch => dispatch({ type: loginErrorUpdate, message })

const _createAction = (cognitoFn, cognitoResponseHandler) =>
  (username, password) => async dispatch => {
    try {
      dispatch(showAppLoader())
      dispatch(setLoginError(null))

      const responseType = await cognitoFn(username, password)
      await cognitoResponseHandler(dispatch, responseType, { username })

    } catch (error) {
      dispatch(setLoginError(error.message))
    } finally {
      dispatch(hideAppLoader())
    }
  }

export const login = _createAction(
  CognitoAuth.login,
  (dispatch, responseType) => {
    if (responseType === CognitoAuth.keysAction.newPasswordRequired) {
      dispatch({ type: loginUserActionUpdate, action: LoginState.userActions.setNewPassword })
    } else if (responseType === CognitoAuth.keysAction.success) {
      dispatch(initUser())
    }
  }
)

export const acceptInvitation = _createAction(
  CognitoAuth.acceptInvitation,
  async (dispatch, responseType, { username }) => {
    if (responseType === CognitoAuth.keysAction.success) {
      await axios.put('/api/user/username', { name: username })
      dispatch({ type: loginUserActionUpdate, action: LoginState.userActions.login })
      dispatch(initUser())
    }
  }
)