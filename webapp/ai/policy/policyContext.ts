/**
 * App instance of the effective policy reader (shared settings cache + survey policy cache). It imports the AI
 * settings hook module (React, store): load it lazily from code that must run under Node (resolveModel).
 */
import { fetchAiSettingsOnce } from '@webapp/components/ai/hooks/useAiFeatureEnabled'

import { createEffectivePolicyReader } from './effectivePolicy'
import { fetchSurveyAiPolicy } from './surveyAiPolicyClient'

/**
 * Returns the effective policy of a request (see createEffectivePolicyReader).
 * @param {object} params - Feature, survey and whether to bypass the cache.
 * @returns {Promise<object>} The policy; rejects when the survey policy cannot be read.
 */
export const getEffectivePolicyFor = createEffectivePolicyReader({
  fetchSurveyPolicy: (surveyId, { fresh }) => fetchSurveyAiPolicy(surveyId, { fresh }),
  fetchSettings: () => fetchAiSettingsOnce(),
})
