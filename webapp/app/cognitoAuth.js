import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js'

const UserPoolId = __COGNITO_USER_POOL_ID__
const ClientId = __COGNITO_CLIENT_ID__

const getUserPool = () => new CognitoUserPool({ UserPoolId, ClientId })

const getUser = () => {
  const pool = getUserPool()
  return pool.getCurrentUser()
}

// Global variables to handle completeNewPasswordChallenge flow
let cognitoUser

const cognitoCallbacks = (resolve, reject) => ({
  onSuccess: result => {
    resolve({ type: 'success' })
  },
  onFailure: error => {
    reject(error)
  },
  newPasswordRequired: (userAttributes) => {
    // the api doesn't accept this field back
    delete userAttributes.email_verified

    resolve({ type: 'newPasswordRequired', user: userAttributes })
  }
})

export const login = (Username, Password) =>
  new Promise((resolve, reject) => {
    const authenticationData = { Username, Password }
    const authenticationDetails = new AuthenticationDetails(authenticationData)

    const Pool = getUserPool()
    const userData = { Username, Pool }

    cognitoUser = new CognitoUser(userData)
    cognitoUser.authenticateUser(
      authenticationDetails,
      cognitoCallbacks(resolve, reject)
    )
  })

export const setNewUserPassword = (password, user) =>
  new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(
      password,
      user,
      cognitoCallbacks(resolve, reject)
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
