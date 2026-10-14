/**
 * App wiring of the batch guard: the AI settings and the survey's effective policy, read from the server before
 * each call. No cache: a change made during a long run must stop it.
 */
import axios from 'axios'

import { getUrl, localErrors } from '../policy/surveyAiPolicyClient'
import type { AiBatchGuardDeps } from './batchRun'

/**
 * The fresh reads the batch guard makes before each call, wired to the app's AI routes.
 * @type {AiBatchGuardDeps}
 */
export const appBatchGuardDeps: AiBatchGuardDeps = {
  /**
   * Reads the user's AI settings (switches, access level, features disabled on the server).
   * @returns {Promise<object|null>} The settings.
   */
  fetchSettings: async () => (await axios.get('/api/ai/settings', localErrors)).data ?? null,
  /**
   * Reads the survey's effective AI policy from the route, not from fetchSurveyAiPolicy: its 30 s cache would hide
   * a change made by an administrator during the run.
   * @param {number} surveyId - Survey id.
   * @returns {Promise<object|null>} The effective policy.
   */
  fetchEffectivePolicy: async (surveyId) => (await axios.get(getUrl(surveyId), localErrors)).data?.effective ?? null,
}
