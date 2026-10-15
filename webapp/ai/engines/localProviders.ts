/**
 * Local AI providers: OpenAI-compatible servers called from this browser (on this computer or the network), stored per
 * user in localStorage and never sent to the Arena server (spec section 1.2). Also the one-time conversion of the old
 * single local server settings (spec section 1.3).
 */
import {
  type AiDefaultProviderOrigin,
  isLocalProviderId,
  LEGACY_LOCAL_PROVIDER_ID,
  LOCAL_PROVIDER_TYPE,
  normalizeProviderName,
} from '@common/ai/providerIds'

import { isPlainHttpBaseUrl, withDefaultHttpScheme } from '@common/ai/localServerAddress'

import {
  getLocalServerSettingsKey,
  MAX_BASE_URL_LENGTH,
  MAX_MODEL_ID_LENGTH,
  normalizeLocalServerSettings,
  stripTrailingSlashes,
  trimmedString,
} from './localServerSettings'
import type { RemovableStorage, StorageLike } from './types'

export type LocalProvider = { id: string; name: string; baseUrl: string; modelId: string | null }

// none: nothing to convert (or only an old entry that was off, removed); failed: the old key stays, retried next load
export type LocalConversionResult = { status: 'none' | 'converted' | 'failed'; defaultApplied: boolean }

/**
 * Returns the localStorage key of the user's local providers.
 * @param {string} userUuid - User UUID.
 * @returns {string} The key.
 */
export const getLocalProvidersKey = (userUuid: string): string => `arena.ai.localProviders.${userUuid}`

/**
 * Returns the base URL to store: trimmed, without trailing slashes, http(s) only, without credentials, query or
 * fragment, at most 2048 chars.
 * @param {unknown} value - Raw value.
 * @returns {string|null} The URL, or null when it is not a plain http(s) URL.
 */
export const normalizeLocalProviderBaseUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = stripTrailingSlashes(value.trim())
  if (!trimmed || trimmed.length > MAX_BASE_URL_LENGTH) return null
  return isPlainHttpBaseUrl(trimmed) ? trimmed : null
}

/**
 * Returns the provider when the stored entry is valid.
 * @param {unknown} input - Raw entry.
 * @returns {LocalProvider|null} The provider, or null.
 */
const normalizeLocalProvider = (input: unknown): LocalProvider | null => {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const baseUrl = normalizeLocalProviderBaseUrl(raw.baseUrl)
  if (!isLocalProviderId(raw.id) || !baseUrl) return null
  return {
    id: raw.id,
    name: normalizeProviderName(raw.name, LOCAL_PROVIDER_TYPE),
    baseUrl,
    modelId: trimmedString(raw.modelId, MAX_MODEL_ID_LENGTH),
  }
}

/**
 * Keeps the valid entries of a stored list; the first entry of an id wins.
 * @param {unknown} input - Raw list.
 * @returns {LocalProvider[]} The providers.
 */
export const normalizeLocalProviders = (input: unknown): LocalProvider[] => {
  if (!Array.isArray(input)) return []
  const providers: LocalProvider[] = []
  const seen = new Set<string>()
  for (const entry of input) {
    const provider = normalizeLocalProvider(entry)
    if (!provider || seen.has(provider.id)) continue
    seen.add(provider.id)
    providers.push(provider)
  }
  return providers
}

/**
 * Reads the user's local providers; unavailable storage or corrupt JSON give an empty list.
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @returns {LocalProvider[]} The providers.
 */
export const loadLocalProviders = ({
  storage,
  userUuid,
}: {
  storage: StorageLike | null
  userUuid: string | null
}): LocalProvider[] => {
  if (!storage || !userUuid) return []
  try {
    const raw = storage.getItem(getLocalProvidersKey(userUuid))
    return raw ? normalizeLocalProviders(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

/**
 * Stores the user's local providers (normalized before saving).
 * @param {object} params - Parameters.
 * @param {StorageLike|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @param {LocalProvider[]} params.providers - Providers.
 * @returns {boolean} False when the storage is unavailable or full.
 */
export const saveLocalProviders = ({
  storage,
  userUuid,
  providers,
}: {
  storage: StorageLike | null
  userUuid: string | null
  providers: LocalProvider[]
}): boolean => {
  if (!storage || !userUuid) return false
  try {
    storage.setItem(getLocalProvidersKey(userUuid), JSON.stringify(normalizeLocalProviders(providers)))
    return true
  } catch {
    return false
  }
}

/**
 * Reads the old single local server settings.
 * @param {StorageLike} storage - Storage.
 * @param {string} key - The old key.
 * @returns {{found: boolean, settings: object|null}} found: the key exists; settings: null when corrupt.
 */
const readLegacySettings = (storage: StorageLike, key: string) => {
  let raw: string | null = null
  try {
    raw = storage.getItem(key)
  } catch {
    return { found: false, settings: null }
  }
  if (raw === null) return { found: false, settings: null }
  try {
    return { found: true, settings: normalizeLocalServerSettings(JSON.parse(raw)) }
  } catch {
    return { found: true, settings: null }
  }
}

/**
 * Removes a key; a failure is reported.
 * @param {RemovableStorage} storage - Storage.
 * @param {string} key - Key.
 * @returns {boolean} True when removed.
 */
const removeKey = (storage: RemovableStorage, key: string): boolean => {
  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/**
 * Adds `local:legacy` to the list unless it is there already (the conversion may run more than once).
 * @param {object} params - Parameters.
 * @param {RemovableStorage} params.storage - Storage.
 * @param {string} params.userUuid - User UUID.
 * @param {string} params.baseUrl - Old base URL.
 * @param {string|null} params.modelId - Old model.
 * @returns {boolean} False when the list could not be written.
 */
const addLegacyProvider = ({
  storage,
  userUuid,
  baseUrl,
  modelId,
}: {
  storage: RemovableStorage
  userUuid: string
  baseUrl: string
  modelId: string | null
}): boolean => {
  const providers = loadLocalProviders({ storage, userUuid })
  // a user who removed local:legacy in the UI while the old key was still there (an earlier run failed after adding
  // it) gets it back once: the old key is removed right after, so this cannot repeat
  if (providers.some((provider) => provider.id === LEGACY_LOCAL_PROVIDER_ID)) return true
  // the old settings accepted an address without a scheme
  const normalizedUrl = normalizeLocalProviderBaseUrl(withDefaultHttpScheme(baseUrl))
  if (!normalizedUrl) return false
  const legacy: LocalProvider = {
    id: LEGACY_LOCAL_PROVIDER_ID,
    name: normalizeProviderName('', LOCAL_PROVIDER_TYPE),
    baseUrl: normalizedUrl,
    modelId,
  }
  if (!saveLocalProviders({ storage, userUuid, providers: [...providers, legacy] })) return false
  // a write that was dropped or normalized away must not cost the old key
  return loadLocalProviders({ storage, userUuid }).some((provider) => provider.id === LEGACY_LOCAL_PROVIDER_ID)
}

/**
 * Converts the old single local server settings into the provider list (spec section 1.3): an old server that was on
 * becomes `local:legacy`; it becomes the default only when the old settings preferred it and the account's default
 * was never picked by the user. The old key is removed only after every step succeeded, so a failure is retried on
 * the next load.
 * @param {object} params - Parameters.
 * @param {RemovableStorage|null} params.storage - Storage.
 * @param {string|null} params.userUuid - User UUID.
 * @param {AiDefaultProviderOrigin} params.defaultProviderOrigin - The account's default origin (GET /api/ai/settings).
 * @param {Function} params.setDefault - `PUT /api/ai/settings/default` with `origin: 'converted'`; resolves to `applied`.
 * @returns {Promise<LocalConversionResult>} What happened.
 */
export const convertLegacyLocalServer = async ({
  storage,
  userUuid,
  defaultProviderOrigin,
  setDefault,
}: {
  storage: RemovableStorage | null
  userUuid: string | null
  defaultProviderOrigin: AiDefaultProviderOrigin
  setDefault: (providerId: string) => Promise<boolean>
}): Promise<LocalConversionResult> => {
  const none: LocalConversionResult = { status: 'none', defaultApplied: false }
  if (!storage || !userUuid) return none
  const key = getLocalServerSettingsKey(userUuid)
  const { found, settings } = readLegacySettings(storage, key)
  if (!found) return none
  // an old server that was off (or a corrupt entry) has nothing to convert
  if (!settings?.enabled) {
    // a key that cannot be removed is harmless: nothing is converted, and the next load removes it again
    removeKey(storage, key)
    return none
  }
  const failed: LocalConversionResult = { status: 'failed', defaultApplied: false }
  if (!addLegacyProvider({ storage, userUuid, baseUrl: settings.baseUrl, modelId: settings.modelId })) return failed
  let defaultApplied = false
  if (settings.preferLocal && defaultProviderOrigin === 'converted') {
    try {
      defaultApplied = await setDefault(LEGACY_LOCAL_PROVIDER_ID)
    } catch {
      return failed
    }
  }
  return removeKey(storage, key) ? { status: 'converted', defaultApplied } : { status: 'failed', defaultApplied }
}

/**
 * Loads the AI settings and runs the local conversion with the account's default origin; when the conversion changed
 * the default on the server, the settings are loaded again so every reader sees the new default.
 * @param {object} params - Parameters.
 * @param {boolean} params.force - Bypass the settings cache.
 * @param {string|null} params.userUuid - User UUID.
 * @param {Function} params.loadSettings - Settings loader.
 * @param {Function} params.convert - The conversion (convertLegacyLocalServer bound to the app's storage and API).
 * @returns {Promise<object|null>} The settings.
 */
export const loadSettingsWithLocalConversion = async <S extends object>({
  force,
  userUuid,
  loadSettings,
  convert,
}: {
  force: boolean
  userUuid: string | null
  loadSettings: (options: { force: boolean }) => Promise<S | null>
  convert: (params: {
    userUuid: string
    defaultProviderOrigin: AiDefaultProviderOrigin
  }) => Promise<LocalConversionResult>
}): Promise<S | null> => {
  const settings = await loadSettings({ force })
  const origin = (settings as { defaultProviderOrigin?: unknown } | null)?.defaultProviderOrigin
  // a failed settings fetch has no origin: the conversion waits for a load that knows it
  if (!userUuid || (origin !== 'converted' && origin !== 'user')) return settings
  const { defaultApplied } = await convert({ userUuid, defaultProviderOrigin: origin })
  // the first load was read before the conversion set the default, so its default and origin are stale
  return defaultApplied ? loadSettings({ force: true }) : settings
}
