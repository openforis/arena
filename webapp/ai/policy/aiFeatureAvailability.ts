/**
 * Types and helpers of the AI feature availability (the availability itself comes from the engine selection,
 * `webapp/ai/engines/featureAvailability.ts`).
 */
import { AiFeaturePermission, getAiFeature } from '@common/ai/features'
import type { AiHostingClass, AiPolicy, AiPolicyLevel } from '@common/ai/policy'

export type AiFeatureAvailabilityStatus = 'available' | 'disabled' | 'policyBlocked' | 'noEngine'

export type AiDataLocation = {
  hostingClass: AiHostingClass | null
  provider: string | null
  model: string | null
  engine?: string | null
}

export type AiFeatureAvailability = {
  status: AiFeatureAvailabilityStatus
  location: AiDataLocation
  reasonKeys?: string[]
}

// brand names: not translated
export const providerDisplayNames: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  'openai-compatible': 'OpenAI-compatible',
  'vercel-ai-sdk': 'Vercel AI SDK',
}

/**
 * Returns true when the feature works on a survey (checked against the survey policy); the Help chat
 * (`loggedIn`) has no survey and is checked against the instance ceilings only.
 * @param {string} feature - Feature key.
 * @returns {boolean} True when survey-scoped.
 */
export const isSurveyScopedFeature = (feature: string): boolean =>
  getAiFeature(feature)?.permission !== AiFeaturePermission.loggedIn

/**
 * Returns the i18n keys (common namespace) explaining why the feature is blocked.
 * @param {object} params - Parameters.
 * @param {string} params.dataClass - Data class of the feature.
 * @param {AiPolicyLevel} params.allowed - Effective level of the class.
 * @param {boolean} params.surveyScoped - False for features without a survey.
 * @returns {string[]} The keys.
 */
export const getPolicyBlockedReasonKeys = ({
  dataClass,
  allowed,
  surveyScoped,
}: {
  dataClass: string
  allowed: AiPolicyLevel
  surveyScoped: boolean
}): string[] =>
  surveyScoped ? [`aiPolicy.blocked.${dataClass}.${allowed}`] : [`aiPolicy.blockedByInstance.${dataClass}`]

/**
 * Returns the policy a feature is checked against: the survey's effective policy, or the instance ceilings for the
 * Help chat. Fails closed: a survey policy error (e.g. a failed refetch) wins over a stale cached state.
 * @param {object} params - Parameters.
 * @param {boolean} params.surveyScoped - False for features without a survey.
 * @param {{effective: AiPolicy}|null} params.state - Cached survey policy state, null until loaded.
 * @param {unknown} params.error - Last error of the survey policy load.
 * @param {AiPolicy|null} params.ceilings - Instance ceilings (from the AI settings).
 * @returns {AiPolicy|null} The policy, or null when it is not known.
 */
export const resolveEffectivePolicy = ({
  surveyScoped,
  state,
  error,
  ceilings,
}: {
  surveyScoped: boolean
  state: { effective: AiPolicy } | null
  error: unknown
  ceilings: AiPolicy | null
}): AiPolicy | null => {
  if (!surveyScoped) return ceilings
  if (error) return null
  return state?.effective ?? null
}

/**
 * Returns true when the feature's entry point is rendered (usable or shown disabled).
 * @param {AiFeatureAvailability} availability - Availability.
 * @returns {boolean} True when shown.
 */
export const isAiFeatureShown = (availability: AiFeatureAvailability): boolean => availability.status !== 'disabled'

/**
 * Returns true when the feature can be used now.
 * @param {AiFeatureAvailability} availability - Availability.
 * @returns {boolean} True when usable.
 */
export const isAiFeatureUsable = (availability: AiFeatureAvailability): boolean => availability.status === 'available'

/**
 * Returns the translated data-location text, or null when there is no hosting class.
 * @param {object} params - Parameters.
 * @param {AiDataLocation} params.location - Location.
 * @param {Function} params.t - Translation function.
 * @returns {string|null} The text.
 */
export const getAiDataLocationText = ({
  location,
  t,
}: {
  location: AiDataLocation
  t: (key: string, params?: object) => string
}): string | null => {
  const { hostingClass, provider, engine } = location
  if (hostingClass === 'cloud') {
    const providerName = provider ? (providerDisplayNames[provider] ?? provider) : null
    return providerName ? t('aiDataLocation.cloudWithProvider', { provider: providerName }) : t('aiDataLocation.cloud')
  }
  if (hostingClass === 'orgHosted') {
    return engine ? t('aiDataLocation.orgHostedWithEngine', { engine }) : t('aiDataLocation.orgHosted')
  }
  if (hostingClass === 'onDevice') {
    return engine ? t('aiDataLocation.onDeviceWithEngine', { engine }) : t('aiDataLocation.onDevice')
  }
  return null
}
