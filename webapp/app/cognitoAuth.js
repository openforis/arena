import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js'

export const keysAction = {
  success: 'success',
  newPasswordRequired: 'newPasswordRequired'
}

const UserPoolId = __COGNITO_USER_POOL_ID__
const ClientId = __COGNITO_CLIENT_ID__

const getUserPool = () => new CognitoUserPool({ UserPoolId, ClientId })

export const getUser = () => getUserPool().getCurrentUser()

const newCognitoUser = Username => new CognitoUser({ Username, Pool: getUserPool() })

// Global variables to handle completeNewPasswordChallenge flow
let cognitoUser
let sessionUserAttributes

const cognitoCallbacks = (onSuccess, onFailure, reset = true) => ({
  onSuccess: () => {
    if (reset) {
      cognitoUser = null
      sessionUserAttributes = null
    }
    onSuccess(keysAction.success)
  },

  onFailure,

  newPasswordRequired: userAttributes => {
    // the api doesn't accept this field back
    delete userAttributes.email_verified

    sessionUserAttributes = userAttributes
    onSuccess(keysAction.newPasswordRequired)
  }
})

export const login = (Username, Password) =>
  new Promise((resolve, reject) => {
    cognitoUser = newCognitoUser(Username)
    cognitoUser.authenticateUser(
      new AuthenticationDetails({ Username, Password }),
      cognitoCallbacks(resolve, reject)
    )
  })

export const acceptInvitation = (name, password) =>
  new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(
      password,
      { ...sessionUserAttributes, name },
      cognitoCallbacks(resolve, reject)
    )
  })

export const logout = () => {
  const user = getUser()
  if (user) {
    user.signOut()
  }
}

export const forgotPassword = username =>
  new Promise((resolve, reject) => {
    // Override Cognito error messages with a more readable one
    if (!username) {
      throw new Error('Please enter your email')
    }

    cognitoUser = newCognitoUser(username)
    cognitoUser.forgotPassword(cognitoCallbacks(resolve, reject, false))
  })

export const resetPassword = (verificationCode, password) =>
  new Promise((resolve, reject) => {
    // Override Cognito error messages with more readable ones
    if (!(new RegExp(/^[\S]+$/)).test(verificationCode)) {
      throw new Error('Please enter a valid verification code')
    } else if (!password) {
      throw new Error('Please specify a new password')
    } else if (!(new RegExp(/^[\S]+.*[\S]+$/)).test(password)) {
      throw new Error('Password should not start nor end with white spaces')
    } else if (password.length < 6) {
      throw new Error('Password does not conform to policy: Password not long enough')
    }

    cognitoUser.confirmPassword(verificationCode, password, cognitoCallbacks(resolve, reject))
  })

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
