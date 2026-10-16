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
  // waits before the retry of the logout request
  wait?: (ms: number) => Promise<void>
}

export type AuthSession = {
  begin: (authToken: string) => Promise<void>
  // serverSessionEnded: false when the server could not be reached, so its session (refresh token cookie) may live on
  end: () => Promise<{ serverSessionEnded: boolean }>
}

// a short network glitch is over after this long
export const LOGOUT_RETRY_DELAY_MS = 500

// read by appErrorsMiddleware: no error toast for the logout request, the warning of the logout says what happened
export const logoutRequestConfig = { errorHandledLocally: true }

/**
 * Waits.
 * @param {number} ms - Milliseconds.
 * @returns {Promise<void>} Resolves after the time.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

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
 * @param {AuthSessionDeps} deps - The logout request, the token setter, the AI reset, the log and the wait.
 * @returns {AuthSession} The steps.
 */
export const createAuthSession = ({
  requestLogout,
  setAuthToken,
  resetAiSession: resetAi,
  log = logAiWarning,
  wait = sleep,
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
      if (failure) {
        await wait(LOGOUT_RETRY_DELAY_MS)
        failure = await tryLogout(requestLogout)
      }
      if (failure) log('The logout request failed twice; this browser was logged out anyway', failure.error)
      return { serverSessionEnded: !failure }
    } finally {
      setAuthToken(null)
      await resetAi()
    }
  },
})

export const authSession: AuthSession = createAuthSession({
  requestLogout: () => axios.post('/auth/logout', null, logoutRequestConfig),
  setAuthToken: ApiConstants.setAuthToken,
  resetAiSession,
})
