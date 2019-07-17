import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js'

const UserPoolId = __COGNITO_USER_POOL_ID__
const ClientId = __COGNITO_CLIENT_ID__

const getUserPool = () => new CognitoUserPool({ UserPoolId, ClientId })

const getUser = () => {
  const pool = getUserPool()
  return pool.getCurrentUser()
}

export const login = (Username, Password) => new Promise((resolve, reject) => {

  const authenticationData = { Username, Password }
  const authenticationDetails = new AuthenticationDetails(authenticationData)

  const Pool = getUserPool()
  const userData = { Username, Pool }
  const cognitoUser = new CognitoUser(userData)

  cognitoUser.authenticateUser(
    authenticationDetails,
    {
      onSuccess: result => {
        const jwtToken = result.getAccessToken().getJwtToken()
        resolve(jwtToken)
      },
      onFailure: error => {
        reject(error)
      }
    }
  )
})

export const logout = () => {
  const user = getUser()
  if (user) {
    user.signOut()
  }
}

/**
 *
 * @returns current accessToken.jwtToken if current session has a user or null if it doesn't
 */
export const getJwtToken = () => new Promise((resolve, reject) => {
  const user = getUser()

  if (user) {
    user.getSession((err, session) => {
      if (err) {
        reject(err)
      }
      const accessToken = session.getAccessToken()
      const jwtToken = accessToken.jwtToken
      resolve(jwtToken)
    })
  } else {
    resolve(null)
  }
})
