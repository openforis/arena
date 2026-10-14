/**
 * Reads and writes the per-user AI settings in `user.prefs.ai`.
 *
 * Why prefs and not a dedicated table: the existing `"user".prefs` JSONB column is the established home for all
 * per-user preferences in Arena (see `core/user/_user/userPrefs.js`), and using it avoids a schema migration. The
 * shape is:
 *
 *   user.prefs.ai = {
 *     accessLevel,            // 0 off, 1 help only, 2 + survey design, 3 + record data (common/ai/accessLevel.ts)
 *     featuresEnabled,        // accessLevel > 0, kept for existing readers
 *     featureToggles,         // one boolean per AiFeatureCategory (common/ai/features.ts)
 *     defaultProviderId,      // 'arena-default' | 'acct:<id>' | 'local:<id>' (common/ai/providerIds.ts)
 *     defaultProviderOrigin,  // 'converted' until the user picks a default
 *     providers,              // account providers (aiProviderPrefs.ts); keys encrypted (secretBox), never sent back
 *   }
 *
 * The providers and the default are edited by aiProviderService.ts; this module saves the access level and toggles.
 */
import * as User from '@core/user/user'
import { AiFeatureCategory } from '@common/ai/features'

import * as UserManager from '@server/modules/user/manager/userManager'

import { getProviderPrefs, withProviderPrefs } from './aiProviderPrefs'
import * as AiProviderService from './aiProviderService'
import {
  areFeaturesEnabledForUser,
  getAccessLevelForUser,
  getAiPrefs as getRawPrefs,
  isCategoryEnabledForUser,
  resolveSavedAccess,
  sanitiseFeatureToggles,
} from './aiUserPrefs'

export { areFeaturesEnabledForUser, isCategoryEnabledForUser }

export const featureCategories = AiFeatureCategory

const PREFS_KEY = 'ai'

/**
 * Returns the user-facing settings (no secrets) for the AI settings panel.
 * @param {object} user - Arena user.
 * @returns {object} The access level, toggles, default provider and the public entries of the account providers.
 */
export const getPublicSettings = (user) => {
  const raw = getRawPrefs(user)
  const accessLevel = getAccessLevelForUser(user)
  const { defaultProviderId, defaultProviderOrigin } = getProviderPrefs(raw)
  return {
    accessLevel,
    featuresEnabled: accessLevel > 0,
    featureToggles: sanitiseFeatureToggles(raw?.featureToggles),
    defaultProviderId,
    defaultProviderOrigin,
    providers: AiProviderService.getPublicProviders(user),
  }
}

/**
 * Stores the AI prefs of the user.
 * @param {object} user - Arena user.
 * @param {object} aiPrefs - AI prefs to store.
 * @returns {Promise<object>} The updated user.
 */
const writeAiPrefs = async (user, aiPrefs) => {
  const prefs = User.getPrefs(user) || {}
  const userUpdated = { ...user, prefs: { ...prefs, [PREFS_KEY]: aiPrefs } }
  await UserManager.updateUserPrefs(userUpdated)
  return userUpdated
}

/**
 * Returns the AI prefs to store after a profile save: the access level and toggles of the request; the providers and
 * the default as stored. Any other field of the request (the old single-provider fields included) is ignored. An old
 * single-provider slot is written as `acct:legacy`, so a user who never opened the provider list keeps it.
 * @param {object} args - Args.
 * @param {object|null} args.existing - Stored AI prefs.
 * @param {object} args.update - Request body (untrusted).
 * @returns {object} The AI prefs to store.
 */
export const buildSavedAiPrefs = ({ existing, update }) =>
  withProviderPrefs({ ...existing, ...resolveSavedAccess(update) }, getProviderPrefs(existing))

/**
 * Saves the profile part of the AI settings (access level and toggles).
 * @param {object} args - Update args.
 * @param {object} args.user - The user.
 * @param {object} args.update - Request body (untrusted).
 * @returns {Promise<object>} The updated user.
 */
export const saveSettings = async ({ user, update }) =>
  writeAiPrefs(user, buildSavedAiPrefs({ existing: getRawPrefs(user), update }))
