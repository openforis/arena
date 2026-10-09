/**
 * Resolves which LLM provider/model to use for a given (user, feature) pair.
 *
 * Precedence:
 *   1. User-configured provider (decrypted from `user.prefs.ai`) if enabled.
 *   2. Admin default provider (env: AI_DEFAULT_*).
 *   3. Otherwise: throws a `SystemError` with key `aiNotConfigured`.
 */
import { ENV } from '@core/processUtils'

import SystemError, { StatusCodes } from '@core/systemError'

import * as AiSettingsService from './aiSettingsService'
import * as ProviderRegistry from './providerRegistry'
import { getProviderHostingClass } from './hostingClass'

export const sources = {
  user: 'user',
  adminDefault: 'admin-default',
}

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
 * Chooses the provider config for the user: their own when enabled and readable, otherwise the admin default.
 * @param {object} user - The Arena user object.
 * @param {object|null} [adminConfig] - Admin default config (injectable for tests).
 * @returns {{cfg: object, source: string}|null} The config and its source, or null when none is available.
 */
export const resolveConfigForUser = (user, adminConfig = adminDefaultConfig()) => {
  const userCfg = AiSettingsService.getEffectiveUserConfig(user)
  if (userCfg) return { cfg: userCfg, source: sources.user }
  if (adminConfig) return { cfg: adminConfig, source: sources.adminDefault }
  return null
}

/**
 * Describes a resolved provider config: provenance plus where the data goes.
 * @param {{cfg: object, source: string}|null} resolved - Result of resolveConfigForUser.
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
 * Resolves the model handle for a (user, feature) pair.
 * @param {object} args - Resolver inputs.
 * @param {object} args.user - The Arena user object.
 * @param {string} args.feature - Feature key (e.g. "translation"). Used for telemetry.
 * @returns {Promise<{model: object, meta: {source: string, provider: string, model: string, hostingClass: string}}>}
 *   The AI SDK model handle plus telemetry metadata.
 * @throws {SystemError} `aiNotConfigured` when no provider is available.
 */
export const resolveModelForUser = async ({ user, feature }) => {
  const resolved = resolveConfigForUser(user)
  if (!resolved) throw new SystemError('aiNotConfigured', { feature }, StatusCodes.SERVICE_UNAVAILABLE)
  const { cfg, source } = resolved
  // user-supplied config goes through the guarded builder (SSRF checks)
  const model = source === sources.user ? await ProviderRegistry.buildUserModel(cfg) : ProviderRegistry.buildModel(cfg)
  return { model, meta: describeResolvedConfig(resolved) }
}

/**
 * Returns the provenance label that the AI Settings UI displays under "Currently using:".
 * Decrypts the user key, so an unreadable key reports the admin default actually used.
 * @param {object} user - The Arena user object.
 * @returns {Promise<{source: ?string, provider: ?string, model: ?string, hostingClass: ?string}>} Provenance info.
 */
export const describeEffectiveSource = async (user) => {
  return describeResolvedConfig(resolveConfigForUser(user))
}
