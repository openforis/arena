import * as CognitoAuth from '../app/cognitoAuth'

import { hideAppLoader, initUser, showAppLoader } from '../app/actions'

export const loginError = 'login/error'
export const loginReset = 'login/reset'

export const login = (username, password) => async dispatch => {
  try {
    dispatch({ type: loginReset })
    dispatch(showAppLoader())

    await CognitoAuth.login(username, password)

    dispatch(initUser())
  } catch (error) {
    dispatch({ type: loginError, message: error.message })
  } finally {
    dispatch(hideAppLoader())
  }
}
