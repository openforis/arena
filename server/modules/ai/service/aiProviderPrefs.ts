/**
 * The account providers stored in `user.prefs.ai` (pure: no database, no secret read), and the read-time conversion
 * of the single provider slot saved before the list existed (spec section 1.3).
 */
import SystemError, { StatusCodes } from '@core/systemError'
import { AiProvider } from '@common/ai/aiProvider'
import {
  ARENA_DEFAULT_PROVIDER_ID,
  type AiDefaultProviderOrigin,
  getDefaultProviderName,
  isAccountProviderId,
  isLocalProviderId,
  LEGACY_ACCOUNT_PROVIDER_ID,
  normalizeProviderName,
} from '@common/ai/providerIds'

import { MOCK_PROVIDER } from './mockProvider'

export type StoredAiProvider = {
  id: string
  type: string
  name: string
  model: string | null
  baseUrl: string | null
  apiKeyEncrypted: string | null
  lastTestOk: boolean | null
  lastTestAt: string | null
}

export type AiProviderPrefs = {
  defaultProviderId: string
  defaultProviderOrigin: AiDefaultProviderOrigin
  providers: StoredAiProvider[]
}

export type PublicAiProvider = {
  id: string
  type: string
  name: string
  model: string | null
  baseUrl: string | null
  hostingClass: string
  hasApiKey: boolean
  apiKeyReadable: boolean
  lastTestOk: boolean | null
  lastTestAt: string | null
}

// keys of the old single provider slot; dropped when the list is written
const LEGACY_SLOT_KEYS = new Set([
  'provider',
  'model',
  'baseUrl',
  'apiKeyEncrypted',
  'enabled',
  'lastTestOk',
  'lastTestAt',
])

// the mock is accepted in storage; the provider service creates it only when AI_MOCK_PROVIDER_ENABLED is on
const ACCOUNT_PROVIDER_TYPES = new Set<string>([...Object.values(AiProvider), MOCK_PROVIDER])

// the providers that call a base URL chosen by the user
const BASE_URL_TYPES = new Set<string>([AiProvider.openaiCompatible, AiProvider.vercelAiSdk])

/**
 * Returns the trimmed value when it is a string with content, else null.
 * @param {unknown} value - Stored or submitted value (untrusted).
 * @returns {string|null} The trimmed string or null.
 */
export const trimmedOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Returns true when the provider type calls a base URL chosen by the user.
 * @param {string} type - Provider type.
 * @returns {boolean} Whether the type uses a base URL.
 */
export const providerTypeUsesBaseUrl = (type: string): boolean => BASE_URL_TYPES.has(type)

/**
 * Removes the trailing slashes of a URL (a loop, not a regex: no backtracking on long input).
 * @param {string|null} url - URL.
 * @returns {string} The URL without trailing slashes ('' for null).
 */
export const stripTrailingSlashes = (url: string | null): string => {
  const value = url ?? ''
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end -= 1
  return value.slice(0, end)
}

/**
 * Returns true when two base URLs name the same endpoint (trailing slashes ignored).
 * @param {string|null} a - First base URL.
 * @param {string|null} b - Second base URL.
 * @returns {boolean} Whether they are the same endpoint.
 */
export const isSameEndpoint = (a: string | null, b: string | null): boolean =>
  stripTrailingSlashes(a) === stripTrailingSlashes(b)

/**
 * Returns a stored list item as a provider, or null when it is not a valid account provider.
 * @param {unknown} item - Stored item (untrusted shape).
 * @returns {StoredAiProvider|null} The provider or null.
 */
const toStoredProvider = (item: unknown): StoredAiProvider | null => {
  if (!item || typeof item !== 'object') return null
  const { id, type, name, model, baseUrl, apiKeyEncrypted, lastTestOk, lastTestAt } = item as Record<string, unknown>
  if (!isAccountProviderId(id) || typeof type !== 'string' || !ACCOUNT_PROVIDER_TYPES.has(type)) return null
  return {
    id,
    type,
    name: normalizeProviderName(name, type),
    model: trimmedOrNull(model),
    baseUrl: BASE_URL_TYPES.has(type) ? trimmedOrNull(baseUrl) : null,
    apiKeyEncrypted: trimmedOrNull(apiKeyEncrypted),
    lastTestOk: typeof lastTestOk === 'boolean' ? lastTestOk : null,
    lastTestAt: trimmedOrNull(lastTestAt),
  }
}

/**
 * Reads a stored provider list: invalid items and duplicate ids are dropped, an unknown default becomes Arena default.
 * @param {object} aiPrefs - Stored AI prefs with a `providers` array.
 * @returns {AiProviderPrefs} The provider prefs.
 */
const readStoredList = (aiPrefs: Record<string, any>): AiProviderPrefs => {
  const providers: StoredAiProvider[] = []
  for (const item of aiPrefs.providers) {
    const provider = toStoredProvider(item)
    if (provider && !providers.some((existing) => existing.id === provider.id)) providers.push(provider)
  }
  const stored = aiPrefs.defaultProviderId
  // a local default lives in a browser: the server keeps it without checking it
  const defaultKnown = isLocalProviderId(stored) || providers.some((provider) => provider.id === stored)
  return {
    defaultProviderId: defaultKnown ? stored : ARENA_DEFAULT_PROVIDER_ID,
    defaultProviderOrigin: aiPrefs.defaultProviderOrigin === 'user' ? 'user' : 'converted',
    providers,
  }
}

/**
 * Converts the old single provider slot to the provider `acct:legacy`.
 * @param {object} aiPrefs - Stored AI prefs without a `providers` array.
 * @returns {StoredAiProvider|null} The converted provider, or null when the slot is empty or invalid.
 */
const convertLegacySlot = (aiPrefs: Record<string, any>): StoredAiProvider | null => {
  const type = aiPrefs.provider
  if (typeof type !== 'string' || !ACCOUNT_PROVIDER_TYPES.has(type)) return null
  // the Vercel AI SDK endpoint has no model choice: the old settings stored its type as the model
  const model = trimmedOrNull(aiPrefs.model) ?? (type === AiProvider.vercelAiSdk ? AiProvider.vercelAiSdk : null)
  if (!model) return null
  return {
    id: LEGACY_ACCOUNT_PROVIDER_ID,
    type,
    name: getDefaultProviderName(type),
    model,
    baseUrl: BASE_URL_TYPES.has(type) ? trimmedOrNull(aiPrefs.baseUrl) : null,
    apiKeyEncrypted: trimmedOrNull(aiPrefs.apiKeyEncrypted),
    lastTestOk: typeof aiPrefs.lastTestOk === 'boolean' ? aiPrefs.lastTestOk : null,
    lastTestAt: trimmedOrNull(aiPrefs.lastTestAt),
  }
}

/**
 * Returns the providers and the default of the stored AI prefs, converting the old slot when there is no list.
 * @param {object|null} aiPrefs - Stored `user.prefs.ai`.
 * @returns {AiProviderPrefs} The provider prefs.
 */
export const getProviderPrefs = (aiPrefs: Record<string, any> | null | undefined): AiProviderPrefs => {
  if (aiPrefs && Array.isArray(aiPrefs.providers)) return readStoredList(aiPrefs)
  const legacy = aiPrefs ? convertLegacySlot(aiPrefs) : null
  return {
    defaultProviderId: legacy && aiPrefs?.enabled ? LEGACY_ACCOUNT_PROVIDER_ID : ARENA_DEFAULT_PROVIDER_ID,
    defaultProviderOrigin: 'converted',
    providers: legacy ? [legacy] : [],
  }
}

/**
 * Returns the AI prefs to store with the given providers: the old slot keys are dropped, the other keys are kept.
 * @param {object|null} aiPrefs - Stored `user.prefs.ai`.
 * @param {AiProviderPrefs} providerPrefs - Providers and default to store.
 * @returns {object} The AI prefs to store.
 */
export const withProviderPrefs = (
  aiPrefs: Record<string, any> | null | undefined,
  providerPrefs: AiProviderPrefs
): Record<string, any> => {
  const rest = Object.fromEntries(Object.entries(aiPrefs ?? {}).filter(([key]) => !LEGACY_SLOT_KEYS.has(key)))
  return {
    ...rest,
    defaultProviderId: providerPrefs.defaultProviderId,
    defaultProviderOrigin: providerPrefs.defaultProviderOrigin,
    providers: providerPrefs.providers,
  }
}

/**
 * Returns the stored provider with the id.
 * @param {AiProviderPrefs} prefs - Provider prefs.
 * @param {string} id - Provider id.
 * @returns {StoredAiProvider|null} The provider, or null when the user has none with that id.
 */
export const findStoredProvider = (prefs: AiProviderPrefs, id: string): StoredAiProvider | null =>
  prefs.providers.find((provider) => provider.id === id) ?? null

/**
 * Returns the entry sent to the browser: everything but the key.
 * @param {object} params - Parameters.
 * @param {StoredAiProvider} params.provider - Stored provider.
 * @param {string} params.hostingClass - Where the gateway sends the data (orgHosted | cloud).
 * @param {boolean} params.apiKeyReadable - Whether the stored key can be decrypted.
 * @returns {PublicAiProvider} The public entry.
 */
export const toPublicProvider = ({
  provider,
  hostingClass,
  apiKeyReadable,
}: {
  provider: StoredAiProvider
  hostingClass: string
  apiKeyReadable: boolean
}): PublicAiProvider => ({
  id: provider.id,
  type: provider.type,
  name: provider.name,
  model: provider.model,
  baseUrl: provider.baseUrl,
  hostingClass,
  hasApiKey: !!provider.apiKeyEncrypted,
  apiKeyReadable,
  lastTestOk: provider.lastTestOk,
  lastTestAt: provider.lastTestAt,
})

/**
 * Decrypts the stored key of a provider.
 * @param {StoredAiProvider} stored - Stored provider.
 * @param {(encrypted: string) => string} decrypt - Decrypt function.
 * @returns {string|null} The key, or null when none is stored.
 * @throws {SystemError} aiApiKeyUnreadable (409) when the key cannot be decrypted (secret rotated).
 */
export const decryptStoredKey = (stored: StoredAiProvider, decrypt: (encrypted: string) => string): string | null => {
  if (!stored.apiKeyEncrypted) return null
  try {
    return decrypt(stored.apiKeyEncrypted)
  } catch {
    // no silent switch to another provider: the user enters the key again (spec section 9)
    throw new SystemError('aiApiKeyUnreadable', { providerId: stored.id }, StatusCodes.CONFLICT)
  }
}
