import { Auth } from 'aws-amplify'

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