/**
 * The user's and the server's on/off switches of the AI features, read from the AI settings response.
 * One reading for the availability hook and the model resolver, so the two agree.
 */
import { getAiFeature, isAiCategoryAvailable } from '@common/ai/features'

// the fields of GET /api/ai/settings used here
export type AiFeatureSwitches = {
  featuresEnabled?: boolean
  featureToggles?: Record<string, boolean>
  // features turned off on the server (AI_FEATURE_FLAGS)
  disabledFeatures?: string[]
}

/**
 * Returns whether the master switch and the category switch are on and the server leaves the category enabled.
 * @param {AiFeatureSwitches|null|undefined} settings - AI settings (null: not loaded, nothing is enabled).
 * @param {string|null} category - Feature category.
 * @returns {boolean} True when the category is enabled.
 */
export const isAiCategoryEnabledInSettings = (
  settings: AiFeatureSwitches | null | undefined,
  category: string | null
): boolean =>
  !!settings &&
  category !== null &&
  !!settings.featuresEnabled &&
  !!settings.featureToggles?.[category] &&
  isAiCategoryAvailable(category, settings.disabledFeatures ?? [])

/**
 * Returns whether a feature is enabled by the settings (its category is, and the server did not disable it).
 * @param {AiFeatureSwitches|null|undefined} settings - AI settings (null: not loaded).
 * @param {string} feature - Feature key.
 * @returns {boolean} True when enabled.
 */
export const isAiFeatureEnabledInSettings = (
  settings: AiFeatureSwitches | null | undefined,
  feature: string
): boolean =>
  isAiCategoryEnabledInSettings(settings, getAiFeature(feature)?.category ?? null) &&
  !(settings?.disabledFeatures ?? []).includes(feature)
