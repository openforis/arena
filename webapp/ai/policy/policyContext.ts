/**
 * App instance of the policy context loader (shared settings cache + survey policy cache). It imports the AI
 * settings hook module (React, store): load it lazily from code that must run under Node (resolveModel).
 */
import { fetchAiSettingsOnce } from '@webapp/components/ai/hooks/useAiFeatureEnabled'

import { createPolicyContextLoader } from './policyContextLoader'
import { fetchSurveyAiPolicy } from './surveyAiPolicyClient'

export type { PolicyContext } from './policyContextLoader'

export const loadPolicyContext = createPolicyContextLoader({
  fetchSettings: () => fetchAiSettingsOnce(),
  fetchSurveyPolicy: (surveyId) => fetchSurveyAiPolicy(surveyId),
})
