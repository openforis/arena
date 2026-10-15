/**
 * What the browser does when a session starts or ends, apart from the Redux state: the auth token and the AI state.
 */
import axios from 'axios'

import { resetAiSession } from '@webapp/ai/session/resetAiSession'
import { ApiConstants } from '@webapp/service/api/utils/apiConstants'

export type AuthSessionDeps = {
  requestLogout: () => Promise<unknown>
  setAuthToken: (authToken: string | null) => void
  resetAiSession: () => Promise<void>
}

export type AuthSession = {
  begin: (authToken: string) => Promise<void>
  end: () => Promise<void>
}

/**
 * Creates the session steps.
 * @param {AuthSessionDeps} deps - The logout request, the token setter and the AI reset.
 * @returns {AuthSession} The steps.
 */
export const createAuthSession = ({
  requestLogout,
  setAuthToken,
  resetAiSession: resetAi,
}: AuthSessionDeps): AuthSession => ({
  begin: async (authToken) => {
    setAuthToken(authToken)
    // the previous session may have ended without a logout (expired): none of its AI state is kept for this user
    await resetAi()
  },
  end: async () => {
    try {
      await requestLogout()
    } catch {
      // network error or expired session: the failed request is reported by the axios middleware, and this browser is
      // logged out all the same
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
