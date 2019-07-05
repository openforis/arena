import Amplify, { Auth } from 'aws-amplify'

export const init = () => {
  Amplify.configure({
    Auth: {
      region: __COGNITO_REGION__,
      userPoolId: __COGNITO_USER_POOL_ID__,
      userPoolWebClientId: __COGNITO_CLIENT_ID__,
    },
    Analytics: {
      disabled: true
    }
  })
}

export const logout = () => {
  Auth.signOut({ global: true })
}

/**
 *
 * @returns current idToken.jwtToken if current session has a user or null if it doesn't
 */
export const getJwtToken = async () => {
  try {
    const session = await Auth.currentSession()
    const idToken = session.getIdToken()
    return idToken.jwtToken
  } catch (e) {
    // No current user
    return null
  }
}