/**
 * Pure readers of the AI preferences stored in `user.prefs.ai` (no database access, so they can be unit tested).
 */
import type { User } from '@openforis/arena-core'

import * as UserUtils from '@core/user/user'
import { AiFeatureCategory } from '@common/ai/features'

const PREFS_KEY = 'ai'

export type AiFeatureToggles = Record<AiFeatureCategory, boolean>

/**
 * Returns the raw `prefs.ai` object of the user.
 * @param {User} user - Arena user.
 * @returns {object|null} The persisted AI prefs, or null.
 */
export const getAiPrefs = (user: User): Record<string, any> | null => {
  const prefs = UserUtils.getPrefs(user) || {}
  return prefs[PREFS_KEY] || null
}

/**
 * Returns the default (all off) category toggles.
 * @returns {AiFeatureToggles} The toggles.
 */
export const defaultFeatureToggles = (): AiFeatureToggles =>
  Object.fromEntries(Object.values(AiFeatureCategory).map((category) => [category, false])) as AiFeatureToggles

/**
 * Keeps only the known categories with a boolean value; the others are off.
 * @param {unknown} input - Toggles from the prefs or from a request body.
 * @returns {AiFeatureToggles} The sanitised toggles.
 */
export const sanitiseFeatureToggles = (input: unknown): AiFeatureToggles => {
  const toggles = defaultFeatureToggles()
  if (!input || typeof input !== 'object') return toggles
  for (const category of Object.keys(toggles)) {
    if (typeof input[category] === 'boolean') toggles[category] = input[category]
  }
  return toggles
}

/**
 * Returns true when the user has switched AI features on (user master switch).
 * @param {User} user - Arena user.
 * @returns {boolean} The master switch state (default false).
 */
export const areFeaturesEnabledForUser = (user: User): boolean => !!getAiPrefs(user)?.featuresEnabled

/**
 * Returns true when the user master switch and the given category toggle are both on.
 * @param {User} user - Arena user.
 * @param {string} category - Feature category.
 * @returns {boolean} Whether the category is enabled.
 */
export const isCategoryEnabledForUser = (user: User, category: string): boolean => {
  const raw = getAiPrefs(user)
  if (!raw?.featuresEnabled) return false
  return !!sanitiseFeatureToggles(raw.featureToggles)[category]
}
