/**
 * Builds what the browser policy check needs: the effective policy (survey, or instance ceilings for features
 * without a survey) and the hosting class of the gateway provider. Pure: transports are injected.
 */
import { aiHostingClasses, normalizeAiPolicy, type AiHostingClass, type AiPolicy } from '@common/ai/policy'

import type { SurveyAiPolicyClientState } from './surveyAiPolicyCache'

export type PolicyContext = { effective: AiPolicy; hostingClass: AiHostingClass | null }

type AiSettingsLike = { hostingClass?: string | null; policyCeilings?: unknown; [key: string]: unknown }

export type PolicyContextLoaderDeps = {
  fetchSettings: () => Promise<AiSettingsLike>
  fetchSurveyPolicy: (surveyId: number) => Promise<SurveyAiPolicyClientState>
}

const allOff: AiPolicy = Object.freeze({ schema: 'off', data: 'off' })

/**
 * Returns the value when it is a known hosting class, else null (fail closed).
 * @param {unknown} value - Hosting class sent by the settings.
 * @returns {AiHostingClass | null} The hosting class or null.
 */
const toHostingClass = (value: unknown): AiHostingClass | null =>
  (aiHostingClasses as readonly unknown[]).includes(value) ? (value as AiHostingClass) : null

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
    return { effective, hostingClass: toHostingClass(settings?.hostingClass) }
  }
