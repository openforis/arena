/**
 * The account providers stored in `user.prefs.ai` (pure: no database, no secret read), and the read-time conversion
 * of the single provider slot saved before the list existed.
 */
import SystemError, { StatusCodes } from '@core/systemError'
import { AiProvider } from '@common/ai/aiProvider'
import { isAllowlisted } from '@common/ai/allowlist'
import {
  ARENA_DEFAULT_PROVIDER_ID,
  type AiDefaultProviderOrigin,
  getDefaultProviderName,
  isAccountProviderId,
  isLocalProviderId,
  LEGACY_ACCOUNT_PROVIDER_ID,
  normalizeProviderName,
} from '@common/ai/providerIds'
import { AI_MAX_ACCOUNT_PROVIDERS, AI_PROVIDER_FIELD_MAX_CHARS } from '@common/ai/providerLimits'

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

// the secret box as the provider prefs use it: the key of a provider is bound to its owner, id, type and endpoint
export type KeyCipher = {
  encrypt: (plain: string, aad: string) => string
  decrypt: (envelope: string, aad: string, options?: { allowLegacy?: boolean }) => string
  isLegacy: (envelope: string) => boolean
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
 * Throws when a value typed for a provider is longer than the limit of its field.
 * @param {object} input - The values typed (untrusted).
 * @returns {void}
 * @throws {SystemError} aiProviderFieldTooLong (400) with the field and its limit.
 */
export const assertFieldLengths = (input: Record<string, unknown>): void => {
  for (const [field, max] of Object.entries(AI_PROVIDER_FIELD_MAX_CHARS)) {
    const value = input[field]
    if (typeof value === 'string' && value.length > max) {
      throw new SystemError('aiProviderFieldTooLong', { field, max }, StatusCodes.BAD_REQUEST)
    }
  }
}

/**
 * Throws when the user already has the most providers that can be saved.
 * @param {readonly unknown[]} providers - The providers stored.
 * @returns {void}
 * @throws {SystemError} aiProviderLimitReached (409) with the limit.
 */
export const assertProviderCountBelowLimit = (providers: readonly unknown[]): void => {
  if (providers.length >= AI_MAX_ACCOUNT_PROVIDERS) {
    throw new SystemError('aiProviderLimitReached', { max: AI_MAX_ACCOUNT_PROVIDERS }, StatusCodes.CONFLICT)
  }
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
 * Returns the AAD that binds the encrypted key of a provider to its owner, id, type and endpoint (trailing slashes
 * ignored, like {@link isSameEndpoint}), so a ciphertext copied to another user, provider or endpoint cannot be read.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - The user that owns the provider.
 * @param {object} params.provider - The provider (id, type and base URL are used).
 * @returns {string} The AAD.
 */
export const buildKeyAad = ({
  userUuid,
  provider,
}: {
  userUuid: string
  provider: Pick<StoredAiProvider, 'id' | 'type' | 'baseUrl'>
}): string => {
  if (typeof userUuid !== 'string' || userUuid.length === 0) throw new TypeError('buildKeyAad: userUuid is required')
  // ids and types have no "|", and the base URL is last, so two different providers never share an AAD
  return [userUuid, provider.id, provider.type, stripTrailingSlashes(provider.baseUrl)].join('|')
}

/**
 * Encrypts the key of a provider, bound to its owner and endpoint.
 * @param {object} params - Parameters.
 * @param {string} params.apiKey - Plain key.
 * @param {string} params.userUuid - The user that owns the provider.
 * @param {object} params.provider - The provider the key is for (id, type and base URL as they will be stored).
 * @param {KeyCipher} params.cipher - The secret box.
 * @returns {string} The encrypted key.
 */
export const encryptProviderKey = ({
  apiKey,
  userUuid,
  provider,
  cipher,
}: {
  apiKey: string
  userUuid: string
  provider: Pick<StoredAiProvider, 'id' | 'type' | 'baseUrl'>
  cipher: Pick<KeyCipher, 'encrypt'>
}): string => cipher.encrypt(apiKey, buildKeyAad({ userUuid, provider }))

/**
 * Returns true when an old key (no AAD) may still be used by the provider: only where the server, not the user, fixes
 * the endpoint the key is sent to. An old key could have been copied from another user's record, and on an endpoint
 * the user chooses it would be sent to a server of the copier.
 * @param {StoredAiProvider} provider - Stored provider.
 * @param {string[]} allowlist - Org-hosted base URLs (AI_ORG_HOSTED_BASE_URLS).
 * @returns {boolean} Whether an old key is accepted for this provider.
 */
export const isLegacyKeyAllowed = (
  provider: Pick<StoredAiProvider, 'type' | 'baseUrl'>,
  allowlist: string[]
): boolean => {
  if (provider.type !== AiProvider.openaiCompatible) return true
  try {
    return !!provider.baseUrl && isAllowlisted(new URL(provider.baseUrl), allowlist)
  } catch {
    return false
  }
}

/**
 * Decrypts the stored key of one of the user's own providers. A key saved without AAD is accepted only where
 * {@link isLegacyKeyAllowed} says so.
 * @param {StoredAiProvider} stored - Stored provider of the user.
 * @param {string} userUuid - The user that owns the provider.
 * @param {KeyCipher['decrypt']} decrypt - Decrypt function.
 * @param {string[]} allowlist - Org-hosted base URLs (AI_ORG_HOSTED_BASE_URLS).
 * @returns {string|null} The key, or null when none is stored.
 * @throws {SystemError} aiApiKeyUnreadable (409) when the key cannot be decrypted (secret rotated, key bound to
 *   another user, provider or endpoint, or an old key where it is not accepted).
 */
export const decryptStoredKey = (
  stored: StoredAiProvider,
  userUuid: string,
  decrypt: KeyCipher['decrypt'],
  allowlist: string[]
): string | null => {
  if (!stored.apiKeyEncrypted) return null
  try {
    return decrypt(stored.apiKeyEncrypted, buildKeyAad({ userUuid, provider: stored }), {
      allowLegacy: isLegacyKeyAllowed(stored, allowlist),
    })
  } catch {
    // no silent switch to another provider: the user enters the key again
    throw new SystemError('aiApiKeyUnreadable', { providerId: stored.id }, StatusCodes.CONFLICT)
  }
}

/**
 * Returns true when the provider has an old key (no AAD) that may be encrypted again.
 * @param {StoredAiProvider} provider - Stored provider.
 * @param {KeyCipher['isLegacy']} isLegacy - Tells an old envelope from a new one.
 * @param {string[]} allowlist - Org-hosted base URLs.
 * @returns {boolean} Whether the key can be upgraded.
 */
const hasUpgradableKey = (provider: StoredAiProvider, isLegacy: KeyCipher['isLegacy'], allowlist: string[]): boolean =>
  !!provider.apiKeyEncrypted && isLegacy(provider.apiKeyEncrypted) && isLegacyKeyAllowed(provider, allowlist)

/**
 * Returns the provider with its old key (no AAD) encrypted again with the AAD. A key found in the record of another
 * user was copied: it is removed, not upgraded. The provider as it is when its key is not an old one, is not accepted
 * or cannot be read.
 * @param {object} params - Parameters.
 * @param {StoredAiProvider} params.provider - Stored provider.
 * @param {string} params.userUuid - The user that owns the provider.
 * @param {KeyCipher} params.cipher - The secret box.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {ReadonlySet<string>} params.copied - The old keys found in the record of another user.
 * @returns {StoredAiProvider} The provider.
 */
const upgradeLegacyKey = ({
  provider,
  userUuid,
  cipher,
  allowlist,
  copied,
}: {
  provider: StoredAiProvider
  userUuid: string
  cipher: KeyCipher
  allowlist: string[]
  copied: ReadonlySet<string>
}): StoredAiProvider => {
  const { apiKeyEncrypted } = provider
  if (!apiKeyEncrypted || !hasUpgradableKey(provider, cipher.isLegacy, allowlist)) return provider
  // random IVs: the same ciphertext in two records can only be a copy, so the key counts as exposed
  if (copied.has(apiKeyEncrypted)) return { ...provider, apiKeyEncrypted: null }
  try {
    const apiKey = decryptStoredKey(provider, userUuid, cipher.decrypt, allowlist)
    return apiKey
      ? { ...provider, apiKeyEncrypted: encryptProviderKey({ apiKey, userUuid, provider, cipher }) }
      : provider
  } catch {
    // an unreadable key stays as it is: the user is asked for it again where it is needed
    return provider
  }
}

/**
 * Returns the old keys (no AAD) of the providers that may be encrypted again.
 * @param {AiProviderPrefs} prefs - Provider prefs.
 * @param {KeyCipher['isLegacy']} isLegacy - Tells an old envelope from a new one.
 * @param {string[]} allowlist - Org-hosted base URLs.
 * @returns {string[]} The envelopes, without repeats.
 */
export const listUpgradableKeys = (
  prefs: AiProviderPrefs,
  isLegacy: KeyCipher['isLegacy'],
  allowlist: string[]
): string[] => [
  ...new Set(
    prefs.providers
      .filter((provider) => hasUpgradableKey(provider, isLegacy, allowlist))
      .map((provider) => provider.apiKeyEncrypted as string)
  ),
]

/**
 * Returns true when a provider has a key stored without AAD that may be encrypted again.
 * @param {AiProviderPrefs} prefs - Provider prefs.
 * @param {KeyCipher['isLegacy']} isLegacy - Tells an old envelope from a new one.
 * @param {string[]} allowlist - Org-hosted base URLs.
 * @returns {boolean} Whether a key needs to be encrypted again.
 */
export const hasLegacyKeys = (prefs: AiProviderPrefs, isLegacy: KeyCipher['isLegacy'], allowlist: string[]): boolean =>
  prefs.providers.some((provider) => hasUpgradableKey(provider, isLegacy, allowlist))

/**
 * Returns the provider prefs with every old key (no AAD) encrypted again with its AAD.
 * @param {object} params - Parameters.
 * @param {AiProviderPrefs} params.prefs - Provider prefs of the user.
 * @param {string} params.userUuid - The user.
 * @param {KeyCipher} params.cipher - The secret box.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {ReadonlySet<string>} [params.copied] - The old keys found in the record of another user.
 * @returns {AiProviderPrefs} The prefs; the same object when no key changed.
 */
export const upgradeLegacyKeys = ({
  prefs,
  userUuid,
  cipher,
  allowlist,
  copied = new Set(),
}: {
  prefs: AiProviderPrefs
  userUuid: string
  cipher: KeyCipher
  allowlist: string[]
  copied?: ReadonlySet<string>
}): AiProviderPrefs => {
  if (!hasLegacyKeys(prefs, cipher.isLegacy, allowlist)) return prefs
  const providers = prefs.providers.map((provider) =>
    upgradeLegacyKey({ provider, userUuid, cipher, allowlist, copied })
  )
  return providers.some((provider, index) => provider !== prefs.providers[index]) ? { ...prefs, providers } : prefs
}

/**
 * Returns the AI prefs with every old key (no AAD) of the account providers encrypted again with its AAD.
 * @param {object} params - Parameters.
 * @param {object|null} params.aiPrefs - Stored `user.prefs.ai`.
 * @param {string} params.userUuid - The user.
 * @param {KeyCipher} params.cipher - The secret box.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {ReadonlySet<string>} [params.copied] - The old keys found in the record of another user.
 * @returns {object|null} The AI prefs; the same object when no key changed.
 */
export const upgradeLegacyKeysInAiPrefs = ({
  aiPrefs,
  userUuid,
  cipher,
  allowlist,
  copied,
}: {
  aiPrefs: Record<string, any> | null
  userUuid: string
  cipher: KeyCipher
  allowlist: string[]
  copied?: ReadonlySet<string>
}): Record<string, any> | null => {
  const prefs = getProviderPrefs(aiPrefs)
  const upgraded = upgradeLegacyKeys({ prefs, userUuid, cipher, allowlist, copied })
  return upgraded === prefs ? aiPrefs : withProviderPrefs(aiPrefs, upgraded)
}
