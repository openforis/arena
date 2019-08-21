import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js'

export const keysAction = {
  success: 'success',
  newPasswordRequired: 'newPasswordRequired'
}

const UserPoolId = __COGNITO_USER_POOL_ID__
const ClientId = __COGNITO_CLIENT_ID__

const _getUserPool = () => new CognitoUserPool({ UserPoolId, ClientId })

const _newCognitoUser = Username => new CognitoUser({ Username, Pool: _getUserPool() })

const _checkPassword = password => {
  if (!password) {
    throw new Error('Please specify a new password')
  }
  if (!(new RegExp(/^[\S]+.*[\S]+$/)).test(password)) {
    throw new Error('Password should not start nor end with white spaces')
  }
  const passwordRegExp = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/)
  if (!passwordRegExp.test(password)) {
    throw new Error('Password should be at least 8 characters long and contain lowercase characters, uppercase characters and numbers')
  }
}

// Global variables to handle completeNewPasswordChallenge flow
let _cognitoUser
let _sessionUserAttributes

const _cognitoCallbacks = (onSuccess, onFailure, reset = true) => ({
  onSuccess: () => {
    if (reset) {
      _cognitoUser = null
      _sessionUserAttributes = null
    }
    onSuccess(keysAction.success)
  },

  onFailure,

  newPasswordRequired: userAttributes => {
    // the api doesn't accept this field back
    delete userAttributes.email_verified

    _sessionUserAttributes = userAttributes
    onSuccess(keysAction.newPasswordRequired)
  }
})

export const getUser = () => _getUserPool().getCurrentUser()

export const login = (Username, Password) =>
  new Promise((resolve, reject) => {
    _cognitoUser = _newCognitoUser(Username)
    _cognitoUser.authenticateUser(
      new AuthenticationDetails({ Username, Password }),
      _cognitoCallbacks(resolve, reject)
    )
  })

export const acceptInvitation = (name, password) =>
  new Promise((resolve, reject) => {
    _checkPassword(password)

    _cognitoUser.completeNewPasswordChallenge(
      password,
      { ..._sessionUserAttributes, name },
      _cognitoCallbacks(resolve, reject)
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

    _cognitoUser = _newCognitoUser(username)
    _cognitoUser.forgotPassword(_cognitoCallbacks(resolve, reject, false))
  })

export const resetPassword = (verificationCode, password) =>
  new Promise((resolve, reject) => {
    // Override Cognito error messages with more readable ones
    if (!(new RegExp(/^[\S]+$/)).test(verificationCode)) {
      throw new Error('Please enter a valid verification code')
    }
    _checkPassword(password)

    _cognitoUser.confirmPassword(verificationCode, password, _cognitoCallbacks(resolve, reject))
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
        return reject(err)
      }

      try {
        const accessToken = session.getAccessToken()
        const jwtToken = accessToken.jwtToken
        resolve(jwtToken)
      } catch (e) {
        reject(e)
      }
    })
  } else {
    resolve(null)
  }
})
