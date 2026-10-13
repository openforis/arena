/**
 * Pure readers of the AI preferences stored in `user.prefs.ai` (no database access, so they can be unit tested).
 */
import type { User } from '@openforis/arena-core'

import * as UserUtils from '@core/user/user'
import { type AiAccessLevel, isCategoryWithinAccessLevel, resolveAiAccessLevel } from '@common/ai/accessLevel'
import { AiFeatureCategory, isAiCategoryOnByDefault } from '@common/ai/features'

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
 * Returns the toggles of a user who set none: off, except the categories on by default.
 * @returns {AiFeatureToggles} The toggles.
 */
export const defaultFeatureToggles = (): AiFeatureToggles =>
  Object.fromEntries(
    Object.values(AiFeatureCategory).map((category) => [category, isAiCategoryOnByDefault(category)])
  ) as AiFeatureToggles

/**
 * Keeps only the known categories with a boolean value; the others keep their default (off, except the categories on by default).
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
 * Returns the user's access level: the stored one, else the one derived from the old master switch and toggles.
 * @param {User} user - Arena user.
 * @returns {AiAccessLevel} The level (0 when nothing is stored).
 */
export const getAccessLevelForUser = (user: User): AiAccessLevel => {
  const raw = getAiPrefs(user)
  if (!raw) return 0
  return resolveAiAccessLevel({
    accessLevel: raw.accessLevel,
    featuresEnabled: !!raw.featuresEnabled,
    featureToggles: sanitiseFeatureToggles(raw.featureToggles),
  })
}

/**
 * Returns true when the user has switched AI features on (access level above Off).
 * @param {User} user - Arena user.
 * @returns {boolean} The master switch state (default false).
 */
export const areFeaturesEnabledForUser = (user: User): boolean => getAccessLevelForUser(user) > 0

/**
 * Returns true when the access level covers the category and its toggle is on.
 * @param {User} user - Arena user.
 * @param {string} category - Feature category.
 * @returns {boolean} Whether the category is enabled.
 */
export const isCategoryEnabledForUser = (user: User, category: string): boolean => {
  const level = getAccessLevelForUser(user)
  if (!isCategoryWithinAccessLevel(category, level)) return false
  return !!sanitiseFeatureToggles(getAiPrefs(user)?.featureToggles)[category]
}

/**
 * Returns the access part of a settings save: the sent level when valid, else the one derived from the old body.
 * @param {object} update - Request body of PUT /api/ai/settings (untrusted).
 * @returns {object} `{ accessLevel, featuresEnabled, featureToggles }` to store.
 */
export const resolveSavedAccess = (
  update: Record<string, any>
): { accessLevel: AiAccessLevel; featuresEnabled: boolean; featureToggles: AiFeatureToggles } => {
  const featureToggles = sanitiseFeatureToggles(update?.featureToggles)
  const accessLevel = resolveAiAccessLevel({
    accessLevel: update?.accessLevel,
    featuresEnabled: !!update?.featuresEnabled,
    featureToggles,
  })
  return { accessLevel, featuresEnabled: accessLevel > 0, featureToggles }
}

/**
 * Returns the AI prefs without the personal provider: the switches stay and AI calls use the admin default.
 * @param {object|null} aiPrefs - Stored AI prefs.
 * @returns {object|null} The prefs to store, or null when nothing is stored.
 */
export const withoutPersonalProvider = (aiPrefs: Record<string, any> | null): Record<string, any> | null =>
  aiPrefs
    ? {
        ...aiPrefs,
        provider: null,
        model: null,
        baseUrl: null,
        apiKeyEncrypted: null,
        enabled: false,
        lastTestOk: null,
        lastTestAt: null,
      }
    : null
