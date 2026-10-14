/**
 * Builds what the browser policy check needs: the effective policy (survey, or instance ceilings for features
 * without a survey). The hosting class is not here: it is the one of the engine the request uses
 * (resolveAssistantEngine sets it). Pure: transports are injected.
 */
import { normalizeAiPolicy, type AiPolicy } from '@common/ai/policy'

import type { SurveyAiPolicyClientState } from './surveyAiPolicyCache'

export type PolicyContext = { effective: AiPolicy }

type AiSettingsLike = { policyCeilings?: unknown; [key: string]: unknown }

export type PolicyContextLoaderDeps = {
  fetchSettings: () => Promise<AiSettingsLike>
  fetchSurveyPolicy: (surveyId: number) => Promise<SurveyAiPolicyClientState>
}

const allOff: AiPolicy = Object.freeze({ schema: 'off', data: 'off' })

/**
 * Returns the instance ceilings sent with the AI settings; both off when they are missing (fetch failed).
 * @param {AiSettingsLike} settings - Settings response.
 * @returns {AiPolicy} The ceilings.
 */
export const getCeilingsFromSettings = (settings: AiSettingsLike | null): AiPolicy =>
  settings?.policyCeilings ? normalizeAiPolicy(settings.policyCeilings) : allOff

/**
 * Creates the policy context loader.
 * @param {PolicyContextLoaderDeps} deps - Transports.
 * @returns {Function} `({ surveyId }) => Promise<PolicyContext>`.
 */
export const createPolicyContextLoader =
  ({ fetchSettings, fetchSurveyPolicy }: PolicyContextLoaderDeps) =>
  async ({ surveyId }: { surveyId?: number | null }): Promise<PolicyContext> => {
    const [settings, surveyPolicy] = await Promise.all([
      fetchSettings(),
      surveyId ? fetchSurveyPolicy(surveyId) : Promise.resolve(null),
    ])
    const effective = surveyPolicy ? surveyPolicy.effective : getCeilingsFromSettings(settings)
    return { effective }
  }
