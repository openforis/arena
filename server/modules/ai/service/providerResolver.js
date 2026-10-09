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
 * Resolves the model handle for a (user, feature) pair.
 * @param {object} args - Resolver inputs.
 * @param {object} args.user - The Arena user object.
 * @param {string} args.feature - Feature key (e.g. "translation"). Used for telemetry.
 * @returns {Promise<{model: object, meta: {source: string, provider: string, model: string}}>}
 *   The AI SDK model handle plus telemetry metadata.
 * @throws {SystemError} `aiNotConfigured` when no provider is available.
 */
export const resolveModelForUser = async ({ user, feature }) => {
  const resolved = resolveConfigForUser(user)
  if (!resolved) throw new SystemError('aiNotConfigured', { feature }, StatusCodes.SERVICE_UNAVAILABLE)
  const { cfg, source } = resolved
  // user-supplied config goes through the guarded builder (SSRF checks)
  const model = source === sources.user ? await ProviderRegistry.buildUserModel(cfg) : ProviderRegistry.buildModel(cfg)
  return { model, meta: { source, provider: cfg.provider, model: cfg.model } }
}

/**
 * Returns the provenance label that the AI Settings UI displays under "Currently using:".
 * Decrypts the user key, so an unreadable key reports the admin default actually used.
 * @param {object} user - The Arena user object.
 * @returns {Promise<{source: ?string, provider: ?string, model: ?string}>} Provenance info.
 */
export const describeEffectiveSource = async (user) => {
  const resolved = resolveConfigForUser(user)
  if (!resolved) return { source: null, provider: null, model: null }
  return { source: resolved.source, provider: resolved.cfg.provider, model: resolved.cfg.model }
}
