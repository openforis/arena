/**
 * The user's access level and on/off switches of the AI features, and the server's, read from the AI settings response.
 * One reading for the availability hook and the model resolver, so the two agree.
 */
import { isCategoryWithinAccessLevel, resolveAiAccessLevel } from '@common/ai/accessLevel'
import { getAiFeature, isAiCategoryAvailable } from '@common/ai/features'

// the fields of GET /api/ai/settings used here
export type AiFeatureSwitches = {
  // 0 off … 3 record data; absent in settings cached before the levels: derived from the two fields below
  accessLevel?: number
  featuresEnabled?: boolean
  featureToggles?: Record<string, boolean>
  // features turned off on the server (AI_FEATURE_FLAGS)
  disabledFeatures?: string[]
}

/**
 * Returns whether the access level covers the category, its switch is on and the server leaves it enabled.
 * @param {AiFeatureSwitches|null|undefined} settings - AI settings (null: not loaded, nothing is enabled).
 * @param {string|null} category - Feature category.
 * @returns {boolean} True when the category is enabled.
 */
export const isAiCategoryEnabledInSettings = (
  settings: AiFeatureSwitches | null | undefined,
  category: string | null
): boolean => {
  if (!settings || category === null) return false
  const level = resolveAiAccessLevel({
    accessLevel: settings.accessLevel,
    featuresEnabled: !!settings.featuresEnabled,
    featureToggles: settings.featureToggles,
  })
  return (
    isCategoryWithinAccessLevel(category, level) &&
    !!settings.featureToggles?.[category] &&
    isAiCategoryAvailable(category, settings.disabledFeatures ?? [])
  )
}

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
