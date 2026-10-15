/**
 * Resolves the provider of a server-side model call from its provider id:
 *   - `acct:<id>`: that account provider of the user (404 aiProviderNotFound when it is not theirs);
 *   - `arena-default`: the admin default (env AI_DEFAULT_*; 503 aiNotConfigured when none);
 *   - `local:<id>`: 400 aiProviderNotGateway (local providers are called from the browser);
 *   - no id: 400 aiCallInvalid (the caller always says which provider; there is no default to fall back on).
 * There is no fallback between providers: an unreadable saved key fails with aiApiKeyUnreadable.
 */
import type { LanguageModelV4 } from '@ai-sdk/provider'
import type { User } from '@openforis/arena-core'

import { ENV } from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import { ARENA_DEFAULT_PROVIDER_ID, isAccountProviderId, isLocalProviderId } from '@common/ai/providerIds'
import * as SecretBox from '@server/utils/crypto/secretBox'

import { decryptStoredKey, findStoredProvider, getProviderPrefs } from './aiProviderPrefs'
import { getAiPrefs } from './aiUserPrefs'
import { getProviderHostingClass } from './hostingClass'
import * as ProviderRegistry from './providerRegistry'
import type { ProviderConfig } from './providerRegistry'

export const sources = {
  user: 'user',
  adminDefault: 'admin-default',
}

type ArenaUser = User

export type ResolvedProviderConfig = { cfg: ProviderConfig; source: string; providerId: string }

/**
 * Provenance of a resolved provider and where its data goes: this is what the survey AI policy and the telemetry read.
 */
export type ProviderMeta = {
  source: string | null
  provider: string | null
  model: string | null
  hostingClass?: string | null
}

/**
 * Returns the admin default provider config from the environment.
 * @returns {ProviderConfig|null} The config, or null when no admin default is set.
 */
const adminDefaultConfig = (): ProviderConfig | null =>
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
 * @returns {ResolvedProviderConfig} The resolved config.
 */
const resolveAccountConfig = ({
  user,
  providerId,
  decrypt,
}: {
  user: ArenaUser
  providerId: string
  decrypt: boolean
}): ResolvedProviderConfig => {
  const stored = findStoredProvider(getProviderPrefs(getAiPrefs(user)), providerId)
  if (!stored) throw new SystemError('aiProviderNotFound', { providerId }, StatusCodes.NOT_FOUND)
  const cfg: ProviderConfig = {
    provider: stored.type,
    model: stored.model,
    baseUrl: stored.baseUrl,
    apiKey: decrypt ? decryptStoredKey(stored, user.uuid, SecretBox.decrypt, ENV.aiOrgHostedBaseUrls ?? []) : null,
  }
  return { cfg, source: sources.user, providerId }
}

/**
 * Resolves the provider config of a call.
 * @param {object} params - Parameters.
 * @param {object} params.user - Arena user.
 * @param {string} [params.providerId] - Requested provider id (format validated by parseGatewayRequest); the call is
 *   refused without one.
 * @param {object|null} [params.adminConfig] - Admin default config (injectable for tests).
 * @param {boolean} [params.decrypt] - Decrypt the key of an account provider (default true).
 * @returns {ResolvedProviderConfig} The config, its source and the provider id.
 * @throws {SystemError} aiCallInvalid (400) without a provider id, aiProviderNotGateway (400),
 *   aiProviderNotFound (404), aiApiKeyUnreadable (409), aiNotConfigured (503).
 */
export const resolveProviderConfig = ({
  user,
  providerId,
  adminConfig = adminDefaultConfig(),
  decrypt = true,
}: {
  user: ArenaUser
  providerId?: string
  adminConfig?: ProviderConfig | null
  decrypt?: boolean
}): ResolvedProviderConfig => {
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
 * @param {Pick<ResolvedProviderConfig, 'cfg' | 'source'>|null} resolved - Result of resolveProviderConfig.
 * @param {string[]} [allowlist] - Org-hosted base URLs (defaults to AI_ORG_HOSTED_BASE_URLS).
 * @returns {ProviderMeta} The description.
 */
export const describeResolvedConfig = (
  resolved: Pick<ResolvedProviderConfig, 'cfg' | 'source'> | null,
  allowlist: string[] = ENV.aiOrgHostedBaseUrls
): ProviderMeta => {
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
 * @param {ProviderConfig|null} [adminConfig] - Admin default config (injectable for tests).
 * @param {string[]} [allowlist] - Org-hosted base URLs (defaults to AI_ORG_HOSTED_BASE_URLS).
 * @returns {{provider: string, model: ?string, hostingClass: ?string}|null} The description, or null when none is set.
 */
export const describeAdminDefault = (
  adminConfig: ProviderConfig | null = adminDefaultConfig(),
  allowlist: string[] = ENV.aiOrgHostedBaseUrls
): { provider: string; model: string | null; hostingClass: string } | null => {
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
 * @param {string} [args.providerId] - Requested provider id; the call is refused without one.
 * @returns {Promise<{model: object, meta: ProviderMeta}>} The AI SDK model handle plus telemetry metadata.
 */
export const resolveModelForUser = async ({
  user,
  providerId,
}: {
  user: ArenaUser
  providerId?: string
  feature?: string
}): Promise<{ model: LanguageModelV4; meta: ProviderMeta }> => {
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
 * @param {ProviderConfig|null} [params.adminConfig] - Admin default config (injectable for tests).
 * @returns {ProviderMeta} Provenance info (empty when the provider cannot be resolved).
 */
export const describeProvider = ({
  user,
  providerId,
  adminConfig = adminDefaultConfig(),
}: {
  user: ArenaUser
  providerId: string
  adminConfig?: ProviderConfig | null
}): ProviderMeta => {
  try {
    return describeResolvedConfig(resolveProviderConfig({ user, providerId, adminConfig, decrypt: false }))
  } catch {
    return describeResolvedConfig(null)
  }
}
