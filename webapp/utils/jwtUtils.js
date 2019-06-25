import axios from 'axios'

import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js'

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID,
}

export const authenticate = (username, password) => {
  var authenticationData = {
    Username: username,
    Password: password,
  }
  const authenticationDetails = new AuthenticationDetails(authenticationData)

  const userPool = new CognitoUserPool(poolData)
  const userData = {
    Username: username,
    Pool: userPool
  }

  const cognitoUser = new CognitoUser(userData)
  console.log(cognitoUser)

  return new Promise(function (resolve, reject) {
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