/**
 * Local AI providers: OpenAI-compatible servers called from this browser (on this computer or the network), stored per
 * user in localStorage and never sent to the Arena server.
 */
import { stripTrailingSlashes } from '@common/ai/allowlist'
import { isPlainHttpBaseUrl } from '@common/ai/localServerAddress'
import { isLocalProviderId, LOCAL_PROVIDER_TYPE, normalizeProviderName } from '@common/ai/providerIds'

import { MAX_BASE_URL_LENGTH, MAX_MODEL_ID_LENGTH, trimmedString } from './localServerSettings'
import type { StorageLike } from './types'

// addressInvalid: the stored address is not a plain http(s) URL (credentials, query or fragment): the entry is kept as
// typed so the user sees it and fixes it, but it is never called
export type LocalProvider = {
  id: string
  name: string
  baseUrl: string
  modelId: string | null
  addressInvalid?: true
}

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
 * Returns the provider when the stored entry is valid. An entry whose address is text but not a plain http(s) URL is
 * kept, flagged addressInvalid; an entry without an address text is dropped.
 * @param {unknown} input - Raw entry.
 * @returns {LocalProvider|null} The provider, or null.
 */
const normalizeLocalProvider = (input: unknown): LocalProvider | null => {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  if (!isLocalProviderId(raw.id)) return null
  const baseUrl = normalizeLocalProviderBaseUrl(raw.baseUrl)
  const asTyped = typeof raw.baseUrl === 'string' ? stripTrailingSlashes(raw.baseUrl.trim()) : ''
  if (!baseUrl && (!asTyped || asTyped.length > MAX_BASE_URL_LENGTH)) return null
  return {
    id: raw.id,
    name: normalizeProviderName(raw.name, LOCAL_PROVIDER_TYPE),
    baseUrl: baseUrl ?? asTyped,
    modelId: trimmedString(raw.modelId, MAX_MODEL_ID_LENGTH),
    ...(baseUrl ? {} : { addressInvalid: true as const }),
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
