/**
 * Resolves which LLM provider/model to use for a given (user, feature) pair.
 *
 * Precedence:
 *   1. User-configured provider (decrypted from `user.prefs.ai`) if enabled.
 *   2. Admin default provider (env: AI_DEFAULT_*).
 *   3. Otherwise: throws a `SystemError` with key `aiNotConfigured`.
 */
import { ENV } from '@core/processUtils'

import SystemError from '@core/systemError'

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
 * Resolves the model handle for a (user, feature) pair.
 * @param {object} args - Resolver inputs.
 * @param {object} args.user - The Arena user object.
 * @param {string} args.feature - Feature key (e.g. "translation"). Used for telemetry.
 * @returns {Promise<{model: object, meta: {source: string, provider: string, model: string}}>}
 *   The Vercel AI SDK model handle plus telemetry metadata.
 * @throws {SystemError} `aiNotConfigured` when no provider is available.
 */
export const resolveModelForUser = async ({ user, feature }) => {
  const userCfg = await AiSettingsService.getEffectiveUserConfig(user)
  if (userCfg) {
    return {
      model: ProviderRegistry.buildModel(userCfg),
      meta: {
        source: sources.user,
        provider: userCfg.provider,
        model: userCfg.model,
      },
    }
  }

  const adminCfg = adminDefaultConfig()
  if (adminCfg) {
    return {
      model: ProviderRegistry.buildModel(adminCfg),
      meta: {
        source: sources.adminDefault,
        provider: adminCfg.provider,
        model: adminCfg.model,
      },
    }
  }

  throw new SystemError('aiNotConfigured', { feature })
}

/**
 * Returns the provenance label that the AI Settings UI displays under
 * "Currently using:". Cheap, no external calls.
 * @param {object} user - The Arena user object.
 * @returns {Promise<{source: string, provider: ?string, model: ?string}>} Provenance info.
 */
export const describeEffectiveSource = async (user) => {
  const userCfg = await AiSettingsService.getEffectiveUserConfig(user, { decrypt: false })
  if (userCfg) {
    return { source: sources.user, provider: userCfg.provider, model: userCfg.model }
  }
  const adminCfg = adminDefaultConfig()
  if (adminCfg) {
    return { source: sources.adminDefault, provider: adminCfg.provider, model: adminCfg.model }
  }
  return { source: null, provider: null, model: null }
}
