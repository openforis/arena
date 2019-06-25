import axios from 'axios'
import { CognitoUserPool } from 'amazon-cognito-identity-js'

const isHandlerEnabled = ({ addJwtHeader = true }) => addJwtHeader

// TODO (jwt) move to jwtUtils.js

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID,
}

const requestHandler = request => {
  if (isHandlerEnabled(request)) {
    const userPool = new CognitoUserPool(poolData)
    const cognitoUser = userPool.getCurrentUser()

    if (cognitoUser !== null) {
      cognitoUser.getSession((err, session) => {
        if (err) {
          alert(err) // TODO (jwt) re-authenticate
        } else {
          const accessToken = session.getAccessToken().jwtToken
          request.headers['Authorization'] = `Bearer ${accessToken}`
        }
      })
    }

    // const jwtToken = window.localStorage.getItem('jwt')

    // if (jwtToken) {
    //   request.headers['Authorization'] = `Bearer ${jwtToken}`
    // }
  }

  return request
}

axios.interceptors.request.use(requestHandler)