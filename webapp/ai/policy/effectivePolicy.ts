/**
 * The effective AI policy of a request, in one place: the engine selection, the tools offered, the availability
 * badge and the batch guard all read it here. Rules: a survey feature is checked against its survey's effective policy
 * (no survey: off), the Help chat against the instance ceilings (no ceilings known: off). Pure: transports are injected.
 */
import { normalizeAiPolicy, type AiPolicy } from '@common/ai/policy'

import { isSurveyScopedFeature, resolveEffectivePolicy } from './aiFeatureAvailability'

// nothing known (no survey for a survey feature, settings not loaded): nothing is allowed
export const OFF_POLICY: AiPolicy = Object.freeze({ schema: 'off', data: 'off' })

type AiSettingsLike = { policyCeilings?: unknown; [key: string]: unknown }

export type EffectivePolicyDeps = {
  // fresh: read it from the server now, not from the cache
  fetchSurveyPolicy: (surveyId: number, options: { fresh: boolean }) => Promise<{ effective: AiPolicy }>
  // the ceilings are server configuration (they change with a restart), so a cached read is always enough
  fetchSettings: () => Promise<AiSettingsLike | null>
}

export type EffectivePolicyParams = {
  // omitted: a request with a survey is a survey request, one without is checked against the ceilings
  feature?: string | null
  surveyId?: number | null
  fresh?: boolean
}

/**
 * Returns the instance ceilings sent with the AI settings; both off when they are missing (fetch failed).
 * @param {AiSettingsLike|null} settings - Settings response.
 * @returns {AiPolicy} The ceilings (record data not above the design).
 */
export const getCeilingsFromSettings = (settings: AiSettingsLike | null): AiPolicy =>
  settings?.policyCeilings ? normalizeAiPolicy(settings.policyCeilings) : OFF_POLICY

/**
 * Creates `getEffectivePolicyFor`.
 * @param {EffectivePolicyDeps} deps - Transports.
 * @returns {Function} `({ feature, surveyId, fresh }) => Promise<AiPolicy>`; rejects when the survey policy cannot be read.
 */
export const createEffectivePolicyReader =
  ({ fetchSurveyPolicy, fetchSettings }: EffectivePolicyDeps) =>
  async ({ feature = null, surveyId = null, fresh = false }: EffectivePolicyParams): Promise<AiPolicy> => {
    const surveyScoped = feature ? isSurveyScopedFeature(feature) : !!surveyId
    const state = surveyScoped && surveyId ? await fetchSurveyPolicy(surveyId, { fresh }) : null
    const ceilings = surveyScoped ? null : getCeilingsFromSettings(await fetchSettings())
    // the same rules as the availability hooks, which read the survey policy from the cache
    return resolveEffectivePolicy({ surveyScoped, state, error: null, ceilings }) ?? OFF_POLICY
  }
