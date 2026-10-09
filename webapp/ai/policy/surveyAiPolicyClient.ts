/**
 * App instance of the survey AI policy cache (axios). Errors are handled by the callers (disabled state, tab
 * message), so the global error notification is skipped.
 */
import axios, { type AxiosRequestConfig } from 'axios'

import type { AiPolicy } from '@common/ai/policy'

import { createSurveyAiPolicyCache, type SurveyAiPolicyClientState } from './surveyAiPolicyCache'

// read by appErrorsMiddleware: the caller shows the error
const localErrors: AxiosRequestConfig & { errorHandledLocally: boolean } = { errorHandledLocally: true }

const getUrl = (surveyId: number): string => `/api/survey/${surveyId}/ai-policy`

const cache = createSurveyAiPolicyCache({
  fetchPolicy: async (surveyId) => (await axios.get(getUrl(surveyId), localErrors)).data,
  putPolicy: async (surveyId, policy) => (await axios.put(getUrl(surveyId), policy, localErrors)).data,
})

/**
 * Returns the survey AI policy (cached for 30 s).
 * @param {number} surveyId - Survey id.
 * @returns {Promise<SurveyAiPolicyClientState>} The policy state.
 */
export const fetchSurveyAiPolicy = (surveyId: number): Promise<SurveyAiPolicyClientState> => cache.get(surveyId)

/**
 * Saves the survey AI policy; every consumer sees the new value right away.
 * @param {number} surveyId - Survey id.
 * @param {AiPolicy} policy - New policy.
 * @returns {Promise<SurveyAiPolicyClientState>} The saved policy state.
 */
export const updateSurveyAiPolicy = (surveyId: number, policy: AiPolicy): Promise<SurveyAiPolicyClientState> =>
  cache.update(surveyId, policy)

/**
 * Forces a refetch on the next read.
 * @param {number} surveyId - Survey id.
 * @returns {void}
 */
export const invalidateSurveyAiPolicy = (surveyId: number): void => cache.invalidate(surveyId)

/**
 * Returns the last known policy state without fetching.
 * @param {number} surveyId - Survey id.
 * @returns {SurveyAiPolicyClientState|null} The state, or null when never loaded.
 */
export const peekSurveyAiPolicy = (surveyId: number): SurveyAiPolicyClientState | null => cache.peek(surveyId)

/**
 * Subscribes to changes of any survey's policy.
 * @param {Function} listener - Called with the survey id.
 * @returns {Function} Unsubscribe function.
 */
export const onSurveyAiPolicyChange = (listener: (surveyId: number) => void): (() => void) => cache.subscribe(listener)

export type { SurveyAiPolicyClientState }
