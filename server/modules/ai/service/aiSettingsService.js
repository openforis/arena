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
 * The providers are edited by aiProviderService.ts. This module keeps the old single-provider body and fields working
 * (legacyProviderSettings.ts) until the old panel is gone.
 */
import * as User from '@core/user/user'
import { LEGACY_ACCOUNT_PROVIDER_ID } from '@common/ai/providerIds'
import { AiFeatureCategory } from '@common/ai/features'

import * as UserManager from '@server/modules/user/manager/userManager'

import { findStoredProvider, getProviderPrefs, withProviderPrefs } from './aiProviderPrefs'
import * as AiProviderService from './aiProviderService'
import {
  areFeaturesEnabledForUser,
  getAccessLevelForUser,
  getAiPrefs as getRawPrefs,
  isCategoryEnabledForUser,
  resolveSavedAccess,
  sanitiseFeatureToggles,
} from './aiUserPrefs'
import { applyLegacyProviderUpdate, removeLegacyProvider, toLegacyPublicFields } from './legacyProviderSettings'

export { areFeaturesEnabledForUser, isCategoryEnabledForUser }

export const featureCategories = AiFeatureCategory

const PREFS_KEY = 'ai'

/**
 * Returns the user-facing settings (no secrets) for the AI settings panel.
 * @param {object} user - Arena user.
 * @returns {object} The access level, toggles, default provider, public provider entries and the old flat fields.
 */
export const getPublicSettings = (user) => {
  const raw = getRawPrefs(user)
  const accessLevel = getAccessLevelForUser(user)
  const { defaultProviderId, defaultProviderOrigin } = getProviderPrefs(raw)
  const providers = AiProviderService.getPublicProviders(user)
  return {
    accessLevel,
    featuresEnabled: accessLevel > 0,
    featureToggles: sanitiseFeatureToggles(raw?.featureToggles),
    defaultProviderId,
    defaultProviderOrigin,
    providers,
    // single-provider fields of the old panel (removed with it in plan 3b)
    ...toLegacyPublicFields({ providers, defaultProviderId }),
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
 * Saves the profile part of the AI settings (access level and toggles). The old body (`featuresEnabled`, `enabled`,
 * `provider`, `model`, `baseUrl`, `apiKey`) still saves the personal provider as `acct:legacy`.
 * @param {object} args - Update args.
 * @param {object} args.user - The user.
 * @param {object} args.update - Request body (untrusted).
 * @returns {Promise<object>} The updated user.
 */
export const saveSettings = async ({ user, update }) => {
  const existing = getRawPrefs(user)
  const access = resolveSavedAccess(update)
  const deps = AiProviderService.createDefaultAiProviderServiceDeps()
  const providerPrefs = applyLegacyProviderUpdate({
    prefs: getProviderPrefs(existing),
    update,
    // encryptKey: 409 aiEncryptionMissing, not a 500, when the server has no secret
    encrypt: (plain) => AiProviderService.encryptKey(plain, deps),
  })
  return writeAiPrefs(user, withProviderPrefs({ ...existing, ...access }, providerPrefs))
}

/**
 * Removes the personal provider of the old panel (`acct:legacy`); the access settings and the other providers stay.
 * @param {object} args - Args.
 * @param {object} args.user - The user.
 * @returns {Promise<object>} The updated user.
 */
export const clearSettings = async ({ user }) => {
  const existing = getRawPrefs(user)
  if (!existing) return user
  return writeAiPrefs(user, withProviderPrefs(existing, removeLegacyProvider(getProviderPrefs(existing))))
}

/**
 * Returns `acct:legacy` when the user has it, so the old panel's calls are checked as a saved provider.
 * @param {object} user - Arena user.
 * @returns {string|undefined} The id, or undefined.
 */
const getLegacyProviderId = (user) =>
  findStoredProvider(getProviderPrefs(getRawPrefs(user)), LEGACY_ACCOUNT_PROVIDER_ID)
    ? LEGACY_ACCOUNT_PROVIDER_ID
    : undefined

/**
 * Old panel test (POST /api/ai/settings/test): the draft is checked against `acct:legacy`, whose key is reused only
 * on its own endpoint.
 * @param {object} args - Args.
 * @param {object} args.user - The user.
 * @param {string} [args.provider] - Draft provider.
 * @param {string} [args.model] - Draft model.
 * @param {string} [args.baseUrl] - Draft base URL.
 * @param {string} [args.apiKey] - Draft API key.
 * @returns {Promise<object>} The test result.
 */
export const testConnection = async ({ user, provider, model, baseUrl, apiKey }) => {
  const id = getLegacyProviderId(user)
  if (!provider && !id) return { ok: false, latencyMs: 0, errorMessage: 'No personal provider configured' }
  const input = provider ? { id, type: provider, model, baseUrl, apiKey } : { id }
  return AiProviderService.testProvider({ user, input })
}

/**
 * Old panel model list (POST /api/ai/settings/models), with the same key rule as testConnection.
 * @param {object} args - Args.
 * @param {object} args.user - Arena user.
 * @param {string} args.provider - Provider key.
 * @param {string} [args.baseUrl] - Base URL.
 * @param {string} [args.apiKey] - API key typed in the form.
 * @returns {Promise<{models: Array<{id: string, description?: string}>}>} Models.
 */
export const listModels = async ({ user, provider, baseUrl, apiKey }) =>
  AiProviderService.listProviderModels({
    user,
    input: { id: getLegacyProviderId(user), type: provider, baseUrl, apiKey },
  })
