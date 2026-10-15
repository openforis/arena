/**
 * What the AI code forgets when the session of a user ends or a user logs in: the running answers and the panel, and
 * every in-memory cache of per-user AI state. The data stored in the browser (conversations, suggestions, local
 * providers) is not cleared: it is keyed by user, and another user of the same browser never reads it.
 */
import { logAiWarning } from '@webapp/ai/log/aiLog'
import { cancelAllConsentRequests } from '@webapp/ai/engines/consentRequests'
import { resetSurveyAiPolicyCache } from '@webapp/ai/policy/surveyAiPolicyCache'
import { categoryItemRefsRegistry } from '@webapp/ai/tools/design/categoryItemRefs'
import { resetAssistantOnLogout } from '@webapp/components/ai/Assistant/assistantLogout'

export type AiSessionReset = { name: string; run: () => void | Promise<void> }

export type ResetAiSessionDeps = {
  // stops the running answers, waits for their saves and resets the panel
  resetAssistant: () => Promise<void>
  // caches of per-user state outside the assistant, independent of each other
  resets: AiSessionReset[]
  log: (message: string, error?: unknown) => void
}

// Every cache of per-user AI state outside the assistant is reset here. The dynamic imports keep the stores that
// import the Redux store (which imports the login actions) out of the module graph of this file.
export const APP_AI_SESSION_RESETS: AiSessionReset[] = [
  {
    name: 'AI settings',
    run: async () => (await import('@webapp/components/ai/hooks/useAiFeatureEnabled')).resetAiSettingsCache(),
  },
  {
    name: 'AI capabilities',
    run: async () => (await import('@webapp/ai/engines/capabilitiesStore')).resetAiCapabilities(),
  },
  { name: 'local server consent requests', run: () => cancelAllConsentRequests() },
  // the survey AI policies, and the requests for them still in flight: another user must not see them
  { name: 'survey AI policies', run: () => resetSurveyAiPolicyCache() },
  // the category items listed to the model, by conversation: the model lists them again when needed
  { name: 'category item refs', run: () => categoryItemRefsRegistry.clearAll() },
]

/**
 * Creates the AI session reset.
 * @param {ResetAiSessionDeps} deps - The assistant reset, the cache resets and the log.
 * @returns {Function} The reset: it never rejects, so a failing cache cannot stop a login or a logout.
 */
export const createResetAiSession =
  ({ resetAssistant, resets, log }: ResetAiSessionDeps) =>
  async (): Promise<void> => {
    // first: a running answer must stop and save before the caches under it are reset
    try {
      await resetAssistant()
    } catch (error) {
      log('The assistant could not be reset', error)
    }
    for (const { name, run } of resets) {
      try {
        await run()
      } catch (error) {
        log(`The ${name} could not be reset`, error)
      }
    }
  }

/**
 * Resets the AI state of the session; called on login (a new user may follow an expired session) and on logout.
 * @returns {Promise<void>} Resolves when done.
 */
export const resetAiSession: () => Promise<void> = createResetAiSession({
  resetAssistant: resetAssistantOnLogout,
  resets: APP_AI_SESSION_RESETS,
  log: logAiWarning,
})
