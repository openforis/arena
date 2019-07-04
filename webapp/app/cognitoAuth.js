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
 * @returns current jwtToken or null if user is not logged in
 */
export const getJwtToken = async () => {
  try {
    const session = await Auth.currentSession()
    return session.getAccessToken().jwtToken
  } catch (e) {
    // No current user
    return null
  }
}