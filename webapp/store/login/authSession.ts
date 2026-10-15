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
  end: () => Promise<void>
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
    setAuthToken(authToken)
    // the previous session may have ended without a logout (expired): none of its AI state is kept for this user
    await resetAi()
  },
  end: async () => {
    try {
      await requestLogout()
    } catch (error) {
      // network error or expired session: this browser is logged out all the same
      log('The logout request failed; the session of this browser was ended anyway', error)
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
