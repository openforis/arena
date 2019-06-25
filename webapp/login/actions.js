// import axios from 'axios'

// import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js'

import * as JwtUtils from '../utils/jwtUtils'

export const loginError = 'login/error'
export const loginSuccess = 'login/success'

export const login = (username, password) => async dispatch => {
  JwtUtils.authenticate(username, password).then(({ user, survey }) => {
    dispatch({ type: loginSuccess, user, survey })
  }, (error) => {
    dispatch({ type: loginError, errorMessage: error })
  })

}