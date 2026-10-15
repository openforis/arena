/**
 * What the browser does when a session starts or ends, apart from the Redux state: the auth token and the AI state.
 */
import axios from 'axios'

import { logAiWarning, type AiLog } from '@webapp/ai/log/aiLog'
import { resetAiSession } from '@webapp/ai/session/resetAiSession'
import { ApiConstants } from '@webapp/service/api/utils/apiConstants'

export type AuthSessionDeps = {
  requestLogout: () => Promise<unknown>
  setAuthToken: (authToken: string | null) => void
  resetAiSession: () => Promise<void>
  log?: AiLog
}

export type AuthSession = {
  begin: (authToken: string) => Promise<void>
  // serverSessionEnded: false when the server could not be reached, so its session (refresh token cookie) may live on
  end: () => Promise<{ serverSessionEnded: boolean }>
}

/**
 * Sends the logout request.
 * @param {Function} requestLogout - The request.
 * @returns {Promise<{ error: unknown }|null>} The failure; null when the request succeeded.
 */
const tryLogout = async (requestLogout: () => Promise<unknown>): Promise<{ error: unknown } | null> => {
  try {
    await requestLogout()
    return null
  } catch (error) {
    return { error }
  }
}

/**
 * Creates the session steps.
 * @param {AuthSessionDeps} deps - The logout request, the token setter, the AI reset and the log.
 * @returns {AuthSession} The steps.
 */
export const createAuthSession = ({
  requestLogout,
  setAuthToken,
  resetAiSession: resetAi,
  log = logAiWarning,
}: AuthSessionDeps): AuthSession => ({
  begin: async (authToken) => {
    // the previous session may have ended without a logout (expired): none of its AI state is kept for this user, and
    // what is still settling must be stopped before the new token exists
    await resetAi()
    setAuthToken(authToken)
  },
  end: async () => {
    try {
      // one retry: a failed request leaves the refresh token cookie, which would log this user in again on reload
      let failure = await tryLogout(requestLogout)
      if (failure) failure = await tryLogout(requestLogout)
      if (failure) log('The logout request failed twice; this browser was logged out anyway', failure.error)
      return { serverSessionEnded: !failure }
    } finally {
      setAuthToken(null)
      await resetAi()
    }
  },
})

export const authSession: AuthSession = createAuthSession({
  requestLogout: () => axios.post('/auth/logout'),
  setAuthToken: ApiConstants.setAuthToken,
  resetAiSession,
})
