/**
 * Compatibility of the single-provider settings (the current panel, and the e2e fixtures' PUT body) with the
 * provider list: the old personal provider is the account provider `acct:legacy`. Removed with the old panel in
 * plan 3b.
 */
import { ARENA_DEFAULT_PROVIDER_ID, getDefaultProviderName, LEGACY_ACCOUNT_PROVIDER_ID } from '@common/ai/providerIds'

import {
  type AiProviderPrefs,
  findStoredProvider,
  isSameEndpoint,
  type PublicAiProvider,
  type StoredAiProvider,
} from './aiProviderPrefs'
import {
  assertCompleteConfig,
  assertType,
  createDefaultAiProviderServiceDeps,
  normalizeInput,
  pickBaseUrl,
  pickModel,
} from './aiProviderService'

/**
 * Builds the `acct:legacy` provider from the old body, validating it with the rules of the provider service.
 * @param {object} params - Parameters.
 * @param {StoredAiProvider|null} params.previous - The current `acct:legacy`, if any.
 * @param {object} params.update - Old PUT body (untrusted).
 * @param {Function} params.encrypt - Key encryption (throws aiEncryptionMissing without a server secret).
 * @returns {StoredAiProvider} The provider to store.
 */
const buildLegacyProvider = ({
  previous,
  update,
  encrypt,
}: {
  previous: StoredAiProvider | null
  update: Record<string, any>
  encrypt: (plain: string) => string | null
}): StoredAiProvider => {
  const type = assertType(update.provider, createDefaultAiProviderServiceDeps())
  const model = pickModel(type, update, null)
  const baseUrl = pickBaseUrl(type, update, null)
  assertCompleteConfig({ provider: type, model, baseUrl, apiKey: null })
  // an omitted key stays only on the endpoint it was saved with (spec section 2); '' clears it
  const { apiKey } = normalizeInput(update)
  const sameEndpoint = !!previous && previous.type === type && isSameEndpoint(previous.baseUrl, baseUrl)
  const keptKey = sameEndpoint ? (previous?.apiKeyEncrypted ?? null) : null
  return {
    id: LEGACY_ACCOUNT_PROVIDER_ID,
    type,
    name: previous?.name ?? getDefaultProviderName(type),
    model,
    baseUrl,
    apiKeyEncrypted: typeof apiKey === 'string' ? (apiKey ? encrypt(apiKey) : null) : keptKey,
    lastTestOk: null,
    lastTestAt: previous?.lastTestAt ?? null,
  }
}

/**
 * Applies the provider part of an old PUT /api/ai/settings body: `enabled: true` with a provider saves it as
 * `acct:legacy` and makes it the default; `enabled: false` makes Arena default the default again when it was
 * `acct:legacy`; a body without `enabled` (the new panel) changes nothing.
 * @param {object} params - Parameters.
 * @param {AiProviderPrefs} params.prefs - Current provider prefs.
 * @param {object} params.update - Request body (untrusted).
 * @param {Function} params.encrypt - Key encryption.
 * @returns {AiProviderPrefs} The provider prefs to store (the same object when nothing changes).
 */
export const applyLegacyProviderUpdate = ({
  prefs,
  update,
  encrypt,
}: {
  prefs: AiProviderPrefs
  update: Record<string, any>
  encrypt: (plain: string) => string | null
}): AiProviderPrefs => {
  if (update?.enabled === true && update.provider) {
    const previous = findStoredProvider(prefs, LEGACY_ACCOUNT_PROVIDER_ID)
    const legacy = buildLegacyProvider({ previous, update, encrypt })
    const providers = previous
      ? prefs.providers.map((provider) => (provider.id === legacy.id ? legacy : provider))
      : [...prefs.providers, legacy]
    return { defaultProviderId: legacy.id, defaultProviderOrigin: 'user', providers }
  }
  if (update?.enabled === false && prefs.defaultProviderId === LEGACY_ACCOUNT_PROVIDER_ID) {
    return { ...prefs, defaultProviderId: ARENA_DEFAULT_PROVIDER_ID, defaultProviderOrigin: 'user' }
  }
  return prefs
}

/**
 * Removes `acct:legacy` (DELETE /api/ai/settings); when it was the default, Arena default becomes the default.
 * @param {AiProviderPrefs} prefs - Current provider prefs.
 * @returns {AiProviderPrefs} The provider prefs to store.
 */
export const removeLegacyProvider = (prefs: AiProviderPrefs): AiProviderPrefs => {
  const providers = prefs.providers.filter((provider) => provider.id !== LEGACY_ACCOUNT_PROVIDER_ID)
  if (prefs.defaultProviderId !== LEGACY_ACCOUNT_PROVIDER_ID) return { ...prefs, providers }
  return { defaultProviderId: ARENA_DEFAULT_PROVIDER_ID, defaultProviderOrigin: 'user', providers }
}

/**
 * Returns the single-provider fields of the old GET body, read from `acct:legacy`.
 * @param {object} params - Parameters.
 * @param {PublicAiProvider[]} params.providers - Public provider entries.
 * @param {string} params.defaultProviderId - Default provider id.
 * @returns {object} `{ provider, model, baseUrl, enabled, hasApiKey, apiKeyReadable, lastTestOk, lastTestAt }`.
 */
export const toLegacyPublicFields = ({
  providers,
  defaultProviderId,
}: {
  providers: PublicAiProvider[]
  defaultProviderId: string
}) => {
  const legacy = providers.find((provider) => provider.id === LEGACY_ACCOUNT_PROVIDER_ID) ?? null
  return {
    provider: legacy?.type ?? null,
    model: legacy?.model ?? null,
    baseUrl: legacy?.baseUrl ?? null,
    enabled: !!legacy && defaultProviderId === LEGACY_ACCOUNT_PROVIDER_ID,
    hasApiKey: legacy?.hasApiKey ?? false,
    apiKeyReadable: legacy?.apiKeyReadable ?? false,
    lastTestOk: legacy?.lastTestOk ?? null,
    lastTestAt: legacy?.lastTestAt ?? null,
  }
}
