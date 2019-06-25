import axios from 'axios'

import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js'

const poolData = {
  UserPoolId: __COGNITO_USER_POOL_ID__,
  ClientId: __COGNITO_CLIENT_ID__,
}

export const getUserPool = () => new CognitoUserPool(poolData)

export const authenticate = (username, password) => {
  const authenticationData = {
    Username: username,
    Password: password,
  }
  const authenticationDetails = new AuthenticationDetails(authenticationData)

  const userPool = getUserPool()
  const userData = {
    Username: username,
    Pool: userPool
  }

  const cognitoUser = new CognitoUser(userData)

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: async result => {
        const { data: { user, survey } } = await axios.get('/auth/user')
        resolve({ user, survey })
      },
      onFailure: err => {
        reject(err)
      }
    })
  })
}