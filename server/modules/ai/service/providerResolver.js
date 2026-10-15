/**
 * Resolves the provider of a server-side model call from its provider id (spec section 3):
 *   - `acct:<id>`: that account provider of the user (404 aiProviderNotFound when it is not theirs);
 *   - `arena-default`: the admin default (env AI_DEFAULT_*; 503 aiNotConfigured when none);
 *   - `local:<id>`: 400 aiProviderNotGateway (local providers are called from the browser);
 *   - no id: 400 aiCallInvalid (the caller always says which provider; there is no default to fall back on).
 * There is no fallback between providers: an unreadable saved key fails with aiApiKeyUnreadable.
 */
import { ENV } from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import { ARENA_DEFAULT_PROVIDER_ID, isAccountProviderId, isLocalProviderId } from '@common/ai/providerIds'
import * as SecretBox from '@server/utils/crypto/secretBox'

import { decryptStoredKey, findStoredProvider, getProviderPrefs } from './aiProviderPrefs'
import { getAiPrefs } from './aiUserPrefs'
import { getProviderHostingClass } from './hostingClass'
import * as ProviderRegistry from './providerRegistry'

export const sources = {
  user: 'user',
  adminDefault: 'admin-default',
}

/**
 * Returns the admin default provider config from the environment.
 * @returns {object|null} The config, or null when no admin default is set.
 */
const adminDefaultConfig = () =>
  ENV.aiDefaultProvider
    ? {
        provider: ENV.aiDefaultProvider,
        model: ENV.aiDefaultModel,
        apiKey: ENV.aiDefaultApiKey,
        baseUrl: ENV.aiDefaultBaseUrl,
      }
    : null

/**
 * Resolves an account provider of the user.
 * @param {object} params - Parameters.
 * @param {object} params.user - Arena user.
 * @param {string} params.providerId - `acct:` id.
 * @param {boolean} params.decrypt - Decrypt the key (false for descriptions).
 * @returns {{cfg: object, source: string, providerId: string}} The resolved config.
 */
const resolveAccountConfig = ({ user, providerId, decrypt }) => {
  const stored = findStoredProvider(getProviderPrefs(getAiPrefs(user)), providerId)
  if (!stored) throw new SystemError('aiProviderNotFound', { providerId }, StatusCodes.NOT_FOUND)
  const cfg = {
    provider: stored.type,
    model: stored.model,
    baseUrl: stored.baseUrl,
    apiKey: decrypt ? decryptStoredKey(stored, SecretBox.decrypt) : null,
  }
  return { cfg, source: sources.user, providerId }
}

/**
 * Resolves the provider config of a call.
 * @param {object} params - Parameters.
 * @param {object} params.user - Arena user.
 * @param {string} params.providerId - Requested provider id (the format is validated by parseGatewayRequest).
 * @param {object|null} [params.adminConfig] - Admin default config (injectable for tests).
 * @param {boolean} [params.decrypt] - Decrypt the key of an account provider (default true).
 * @returns {{cfg: object, source: string, providerId: string}} The config, its source and the provider id.
 * @throws {SystemError} aiCallInvalid (400) without a provider id, aiProviderNotGateway (400),
 *   aiProviderNotFound (404), aiApiKeyUnreadable (409), aiNotConfigured (503).
 */
export const resolveProviderConfig = ({ user, providerId, adminConfig = adminDefaultConfig(), decrypt = true }) => {
  if (!providerId) throw new SystemError('aiCallInvalid', { reason: 'providerId' }, StatusCodes.BAD_REQUEST)
  if (isLocalProviderId(providerId))
    throw new SystemError('aiProviderNotGateway', { providerId }, StatusCodes.BAD_REQUEST)
  if (isAccountProviderId(providerId)) return resolveAccountConfig({ user, providerId, decrypt })
  if (providerId !== ARENA_DEFAULT_PROVIDER_ID) {
    throw new SystemError('aiProviderNotFound', { providerId: String(providerId).slice(0, 80) }, StatusCodes.NOT_FOUND)
  }
  if (!adminConfig) throw new SystemError('aiNotConfigured', {}, StatusCodes.SERVICE_UNAVAILABLE)
  return { cfg: adminConfig, source: sources.adminDefault, providerId: ARENA_DEFAULT_PROVIDER_ID }
}

/**
 * Describes a resolved provider config: provenance plus where the data goes.
 * @param {{cfg: object, source: string}|null} resolved - Result of resolveProviderConfig.
 * @param {string[]} [allowlist] - Org-hosted base URLs (defaults to AI_ORG_HOSTED_BASE_URLS).
 * @returns {{source: ?string, provider: ?string, model: ?string, hostingClass: ?string}} The description.
 */
export const describeResolvedConfig = (resolved, allowlist = ENV.aiOrgHostedBaseUrls) => {
  if (!resolved) return { source: null, provider: null, model: null, hostingClass: null }
  const { cfg, source } = resolved
  return {
    source,
    provider: cfg.provider,
    model: cfg.model,
    hostingClass: getProviderHostingClass({ provider: cfg.provider, baseUrl: cfg.baseUrl, allowlist }),
  }
}

/**
 * Describes the instance default provider for the settings panel ("Arena default" row). Never the key.
 * @param {object|null} [adminConfig] - Admin default config (injectable for tests).
 * @param {string[]} [allowlist] - Org-hosted base URLs (defaults to AI_ORG_HOSTED_BASE_URLS).
 * @returns {{provider: string, model: ?string, hostingClass: ?string}|null} The description, or null when none is set.
 */
export const describeAdminDefault = (adminConfig = adminDefaultConfig(), allowlist = ENV.aiOrgHostedBaseUrls) => {
  if (!adminConfig) return null
  const { provider, model, hostingClass } = describeResolvedConfig(
    { cfg: adminConfig, source: sources.adminDefault },
    allowlist
  )
  return { provider, model: model ?? null, hostingClass }
}

/**
 * Resolves the model handle of a call.
 * @param {object} args - Resolver inputs.
 * @param {object} args.user - The Arena user object.
 * @param {string} args.providerId - Requested provider id.
 * @returns {Promise<{model: object, meta: {source: string, provider: string, model: string, hostingClass: string}}>}
 *   The AI SDK model handle plus telemetry metadata.
 */
export const resolveModelForUser = async ({ user, providerId }) => {
  const resolved = resolveProviderConfig({ user, providerId })
  const { cfg, source } = resolved
  // user-supplied config goes through the guarded builder (SSRF checks)
  const model = source === sources.user ? await ProviderRegistry.buildUserModel(cfg) : ProviderRegistry.buildModel(cfg)
  return { model, meta: describeResolvedConfig(resolved) }
}

/**
 * Describes a provider of a user without decrypting its key, so that an unreadable key still names its provider (the
 * call then fails with aiApiKeyUnreadable).
 * @param {object} params - Parameters.
 * @param {object} params.user - The Arena user object.
 * @param {string} params.providerId - Provider id.
 * @param {object|null} [params.adminConfig] - Admin default config (injectable for tests).
 * @returns {{source: ?string, provider: ?string, model: ?string, hostingClass: ?string}} Provenance info (empty when
 *   the provider cannot be resolved).
 */
export const describeProvider = ({ user, providerId, adminConfig = adminDefaultConfig() }) => {
  try {
    return describeResolvedConfig(resolveProviderConfig({ user, providerId, adminConfig, decrypt: false }))
  } catch {
    return describeResolvedConfig(null)
  }
}
