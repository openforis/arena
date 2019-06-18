import axios from 'axios'

import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js'

export const loginError = 'login/error'
export const loginSuccess = 'login/success'


export const login = (username, password) => async dispatch => {
  var authenticationData = {
    Username: username,
    Password: password,
  }
  const authenticationDetails = new AuthenticationDetails(authenticationData)

  const poolData = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    ClientId: process.env.COGNITO_CLIENT_ID,
  }
  const userPool = new CognitoUserPool(poolData)
  const userData = {
    Username: username,
    Pool: userPool
  }

  const cognitoUser = new CognitoUser(userData)
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: async result => {
      const accessToken = result.getAccessToken().getJwtToken()

      dispatch({ type: 'jwt', jwt: accessToken })
      window.localStorage.setItem('jwt', accessToken)

      const resp = await axios.get('/auth/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    },
    onFailure: err => {
      alert('Error with Cognito authentication')
      console.log(err)
    }
  })
}


// export const login_ = (username, password) => async dispatch => {
//   try {
//     const {data} = await axios.post('/auth/login', {username, password})

//     const {message: errorMessage, user, survey} = data

//     if (errorMessage)
//       dispatch({type: loginError, errorMessage})
//     else
//       dispatch({type: loginSuccess, user, survey})

//   } catch (e) {
//     alert(e)
//   }
// }
