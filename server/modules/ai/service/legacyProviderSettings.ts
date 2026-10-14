/**
 * Compatibility of the single-provider settings (the current panel, and the e2e fixtures' PUT body) with the
 * provider list: the old personal provider is the account provider `acct:legacy`. Removed with the old panel in
 * plan 3b.
 */
import { ARENA_DEFAULT_PROVIDER_ID, getDefaultProviderName, LEGACY_ACCOUNT_PROVIDER_ID } from '@common/ai/providerIds'

import { resolveSavedAccess } from './aiUserPrefs'
import {
  type AiProviderPrefs,
  findStoredProvider,
  isSameEndpoint,
  trimmedOrNull,
  type PublicAiProvider,
  type StoredAiProvider,
} from './aiProviderPrefs'
import {
  assertCompleteConfig,
  type AiProviderServiceDeps,
  assertType,
  createDefaultAiProviderServiceDeps,
  encryptKey,
  normalizeInput,
  pickBaseUrl,
  pickModel,
} from './aiProviderService'

/**
 * Builds the `acct:legacy` provider from the old body, validating it with the rules of the provider service.
 * @param {object} params - Parameters.
 * @param {StoredAiProvider|null} params.previous - The current `acct:legacy`, if any.
 * @param {object} params.update - Old PUT body (untrusted).
 * @param {AiProviderServiceDeps} params.deps - Service dependencies (key encryption throws aiEncryptionMissing without a server secret).
 * @returns {StoredAiProvider} The provider to store.
 */
const buildLegacyProvider = ({
  previous,
  update,
  deps,
}: {
  previous: StoredAiProvider | null
  update: Record<string, any>
  deps: AiProviderServiceDeps
}): StoredAiProvider => {
  const type = assertType(update.provider, deps)
  const model = pickModel(type, update, null)
  const baseUrl = pickBaseUrl(type, update, null)
  assertCompleteConfig({ provider: type, model, baseUrl, apiKey: null })
  // an omitted key stays only on the endpoint it was saved with (spec section 2); '' clears it
  const { apiKey } = normalizeInput(update)
  const sameEndpoint = !!previous && previous.type === type && isSameEndpoint(previous.baseUrl, baseUrl)
  const keptKey = sameEndpoint ? (previous?.apiKeyEncrypted ?? null) : null
  // the typed key is trimmed like the service does, so Test and Save agree; '' clears
  const typedKey = typeof apiKey === 'string' ? trimmedOrNull(apiKey) : undefined
  const apiKeyEncrypted = typeof apiKey === 'string' ? encryptKey(typedKey ?? null, deps) : keptKey
  return {
    id: LEGACY_ACCOUNT_PROVIDER_ID,
    type,
    name: previous?.name ?? getDefaultProviderName(type),
    model,
    baseUrl,
    apiKeyEncrypted,
    lastTestOk: null,
    lastTestAt: previous?.lastTestAt ?? null,
  }
}

/**
 * Applies the provider part of an old PUT /api/ai/settings body: `enabled: true` with a provider saves it as
 * `acct:legacy` and makes it the default; `enabled: false` makes Arena default the default again when it was
 * `acct:legacy`; a body without `enabled` (the new panel) changes nothing. A body that turns AI off (access level 0)
 * does not save a provider, as the old save only processed it while features were on.
 * @param {object} params - Parameters.
 * @param {AiProviderPrefs} params.prefs - Current provider prefs.
 * @param {object} params.update - Request body (untrusted).
 * @param {AiProviderServiceDeps} [params.deps] - Service dependencies (default: the real ones).
 * @returns {AiProviderPrefs} The provider prefs to store (the same object when nothing changes).
 */
export const applyLegacyProviderUpdate = ({
  prefs,
  update,
  deps = createDefaultAiProviderServiceDeps(),
}: {
  prefs: AiProviderPrefs
  update: Record<string, any>
  deps?: AiProviderServiceDeps
}): AiProviderPrefs => {
  const aiOff = resolveSavedAccess(update).accessLevel === 0
  if (update?.enabled === true && update.provider && !aiOff) {
    const previous = findStoredProvider(prefs, LEGACY_ACCOUNT_PROVIDER_ID)
    const legacy = buildLegacyProvider({ previous, update, deps })
    const providers = previous
      ? prefs.providers.map((provider) => (provider.id === legacy.id ? legacy : provider))
      : [...prefs.providers, legacy]
    // saving the same default again is not a choice: plan 3b converts a 'converted' default only while it is untouched
    const unchanged = prefs.defaultProviderId === legacy.id
    return {
      defaultProviderId: legacy.id,
      defaultProviderOrigin: unchanged ? prefs.defaultProviderOrigin : 'user',
      providers,
    }
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
