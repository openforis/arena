import { getAiFeature } from '@common/ai/features'
import type { AiHostingClass } from '@common/ai/policy'

import {
  getAiFeatureAvailability,
  isSurveyScopedFeature,
  resolveEffectivePolicy,
  type AiFeatureAvailability,
} from '@webapp/ai/policy/aiFeatureAvailability'
import { getCeilingsFromSettings, toHostingClass } from '@webapp/ai/policy/policyContextLoader'
import { useSurveyAiPolicy } from '@webapp/ai/policy/useSurveyAiPolicy'

import { getAiSettingsSnapshot, useAiFeatureEnabled } from './useAiFeatureEnabled'

type AiSettingsSnapshot = {
  hostingClass?: AiHostingClass | string | null
  effectiveProvider?: string | null
  effectiveModel?: string | null
  policyCeilings?: unknown
  // features turned off on the server (AI_FEATURE_FLAGS, A)
  disabledFeatures?: string[]
}

/**
 * Returns whether the inline AI feature is hidden, usable or blocked by the survey AI policy, and where its data
 * goes. Replaces useAiFeatureEnabled in the inline features.
 * @param {string} feature - Feature key (common/ai/features).
 * @returns {AiFeatureAvailability} The availability.
 */
export const useAiFeatureAvailability = (feature: string): AiFeatureAvailability => {
  const category = getAiFeature(feature)?.category ?? null
  // re-renders on every settings change, so the snapshot below is current
  const categoryEnabled = useAiFeatureEnabled(category)
  const settings = getAiSettingsSnapshot() as AiSettingsSnapshot | null
  // useAiFeatureEnabled checks the category; one feature of it may still be off on the server
  const enabled = categoryEnabled && !(settings?.disabledFeatures ?? []).includes(feature)
  const surveyScoped = isSurveyScopedFeature(feature)
  const { state, error } = useSurveyAiPolicy({ skip: !enabled || !surveyScoped })

  const ceilings = settings ? getCeilingsFromSettings(settings) : null
  const effective = resolveEffectivePolicy({ surveyScoped, state, error, ceilings })
  const location = {
    // an unknown class is null, like in resolveModel
    hostingClass: toHostingClass(settings?.hostingClass),
    provider: settings?.effectiveProvider ?? null,
    model: settings?.effectiveModel ?? null,
  }
  return getAiFeatureAvailability({ feature, enabled, effective, location })
}
