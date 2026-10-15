/**
 * App instance of the effective policy reader (shared settings cache + survey policy cache). It imports the AI
 * settings hook module (React, store): load it lazily from code that must run under Node (resolveModel).
 */
import type { AiPolicy } from '@common/ai/policy'

import { fetchAiSettingsOnce } from '@webapp/components/ai/hooks/useAiFeatureEnabled'

import { createEffectivePolicyReader, type EffectivePolicyParams } from './effectivePolicy'
import { fetchSurveyAiPolicy } from './surveyAiPolicyClient'

export type PolicyContext = { effective: AiPolicy }

/**
 * Returns the effective policy of a request (see createEffectivePolicyReader).
 * @param {EffectivePolicyParams} params - Feature, survey and whether to bypass the cache.
 * @returns {Promise<AiPolicy>} The policy; rejects when the survey policy cannot be read.
 */
export const getEffectivePolicyFor = createEffectivePolicyReader({
  fetchSurveyPolicy: (surveyId, { fresh }) => fetchSurveyAiPolicy(surveyId, { fresh }),
  fetchSettings: () => fetchAiSettingsOnce(),
})

/**
 * Returns what the browser policy check needs: the effective policy of the request.
 * @param {EffectivePolicyParams} params - Feature (optional) and survey.
 * @returns {Promise<PolicyContext>} The policy context.
 */
export const loadPolicyContext = async (params: EffectivePolicyParams): Promise<PolicyContext> => ({
  effective: await getEffectivePolicyFor(params),
})
