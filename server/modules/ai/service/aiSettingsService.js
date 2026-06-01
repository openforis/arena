/**
 * Reads and writes per-user AI configuration from `user.prefs.ai`.
 *
 * The API key is encrypted at rest (AES-256-GCM via `secretBox`) and never
 * crosses back to the frontend; read endpoints surface only `hasApiKey`.
 *
 * Why prefs and not a dedicated table: the existing `"user".prefs` JSONB
 * column is the established home for all per-user preferences in Arena
 * (see `core/user/_user/userPrefs.js`), and using it avoids a schema
 * migration. The shape is:
 *
 *   user.prefs.ai = {
 *     featuresEnabled,        // master switch — user wants AI at all
 *     featureToggles,         // { chat, expressions, analysis } booleans
 *     provider, model, baseUrl, apiKeyEncrypted,
 *     enabled,                // use OWN provider vs. admin default
 *     lastTestOk, lastTestAt,
 *   }
 *
 * `featuresEnabled` is the user-level master kill switch. `enabled` is the
 * narrower provider-override flag (user provider vs. admin default).
 */
import { generateText } from 'ai'

import * as User from '@core/user/user'
import SystemError from '@core/systemError'

import * as UserManager from '@server/modules/user/manager/userManager'
import * as SecretBox from '@server/utils/crypto/secretBox'

import * as ModelDiscovery from './modelDiscovery'
import * as ProviderRegistry from './providerRegistry'

const PREFS_KEY = 'ai'

export const featureCategories = {
  chat: 'chat',
  expressions: 'expressions',
  translation: 'translation',
  analysis: 'analysis',
}

const defaultFeatureToggles = () => ({
  [featureCategories.chat]: false,
  [featureCategories.expressions]: false,
  [featureCategories.translation]: false,
  [featureCategories.analysis]: false,
})

const sanitiseFeatureToggles = (input) => {
  const base = defaultFeatureToggles()
  if (!input || typeof input !== 'object') return base
  for (const key of Object.keys(base)) {
    if (typeof input[key] === 'boolean') base[key] = input[key]
  }
  return base
}

const sanitiseProvider = (provider) => {
  if (!ProviderRegistry.isSupported(provider)) {
    throw new SystemError('aiProviderInvalid', { provider })
  }
  return provider
}

/**
 * Returns the raw `prefs.ai` object for a user, or `null` if none.
 * @param {object} user - Arena user.
 * @returns {?object} The persisted AI prefs, or null.
 */
const getRawPrefs = (user) => {
  const prefs = User.getPrefs(user) || {}
  return prefs[PREFS_KEY] || null
}

/**
 * Returns the user-facing settings shape (no secrets) for the AI Settings
 * page.
 * @param {object} user - Arena user.
 * @returns {object} Settings descriptor with `hasApiKey` rather than the key itself.
 */
export const getPublicSettings = (user) => {
  const raw = getRawPrefs(user)
  if (!raw) {
    return {
      featuresEnabled: false,
      featureToggles: defaultFeatureToggles(),
      provider: null,
      model: null,
      baseUrl: null,
      enabled: false,
      hasApiKey: false,
      lastTestOk: null,
      lastTestAt: null,
    }
  }
  return {
    featuresEnabled: !!raw.featuresEnabled,
    featureToggles: sanitiseFeatureToggles(raw.featureToggles),
    provider: raw.provider || null,
    model: raw.model || null,
    baseUrl: raw.baseUrl || null,
    enabled: !!raw.enabled,
    hasApiKey: !!raw.apiKeyEncrypted,
    lastTestOk: raw.lastTestOk ?? null,
    lastTestAt: raw.lastTestAt || null,
  }
}

/**
 * Returns true when the user has opted into AI features overall.
 * @param {object} user - Arena user.
 * @returns {boolean} The master-toggle state (default false).
 */
export const areFeaturesEnabledForUser = (user) => !!getRawPrefs(user)?.featuresEnabled

/**
 * Returns true when the user has both the master toggle on and the given
 * category toggle on. Admin-level ENV flags are checked separately by the
 * caller (see `modelClient.assertFeaturesEnabled`).
 * @param {object} user - Arena user.
 * @param {string} category - One of {@link featureCategories}.
 * @returns {boolean} Whether the user wants this category active.
 */
export const isCategoryEnabledForUser = (user, category) => {
  const raw = getRawPrefs(user)
  if (!raw?.featuresEnabled) return false
  const toggles = sanitiseFeatureToggles(raw.featureToggles)
  return !!toggles[category]
}

/**
 * Returns a fully-resolved provider config (including the decrypted API key)
 * for the user, or `null` when the user has not enabled a personal provider.
 *
 * Pass `{ decrypt: false }` to skip the key decryption when the caller only
 * needs metadata (e.g. the "Currently using:" label).
 * @param {object} user - Arena user.
 * @param {object} [options] - Tuning.
 * @param {boolean} [options.decrypt] - Decrypt the API key (default true).
 * @returns {?object} Provider config or null.
 */
export const getEffectiveUserConfig = (user, { decrypt = true } = {}) => {
  const raw = getRawPrefs(user)
  if (!raw || !raw.featuresEnabled || !raw.enabled || !raw.provider || !raw.model) return null
  return {
    provider: raw.provider,
    model: raw.model,
    baseUrl: raw.baseUrl || null,
    apiKey: decrypt && raw.apiKeyEncrypted ? SecretBox.decrypt(raw.apiKeyEncrypted) : null,
  }
}

/**
 * Persists the user's AI settings, merging into the existing prefs blob and
 * encrypting the key before storage. Pass `apiKey: undefined` to leave the
 * existing key untouched; pass `apiKey: ''` to clear it.
 *
 * Validation rules:
 *   - When `featuresEnabled` is false, no provider validation is performed
 *     (user is opting out — we just store the toggles and preserve any
 *     prior provider config in case they re-enable later).
 *   - When `featuresEnabled` is true and `enabled` (provider override) is
 *     true, provider + model + (where applicable) baseUrl are required.
 *   - When `featuresEnabled` is true and `enabled` is false, the user is
 *     relying on the admin default — provider fields are persisted as-is
 *     without strict validation, so the form can be saved with empty
 *     provider config.
 * @param {object} args - Update args.
 * @param {object} args.user - The user (will be re-fetched fresh from DB).
 * @param {object} args.update - The new settings.
 * @param {boolean} [args.update.featuresEnabled] - User-level master toggle.
 * @param {object} [args.update.featureToggles] - Per-category booleans.
 * @param {string} [args.update.provider] - Provider key.
 * @param {string} [args.update.model] - Model identifier.
 * @param {string} [args.update.baseUrl] - Optional custom base URL.
 * @param {string} [args.update.apiKey] - New API key (omit to keep existing).
 * @param {boolean} [args.update.enabled] - Whether the user-provider override is active.
 * @returns {Promise<object>} The new public settings descriptor.
 */
export const saveSettings = async ({ user, update }) => {
  const existing = getRawPrefs(user) || {}
  const featuresEnabled = !!update.featuresEnabled
  const featureToggles = sanitiseFeatureToggles(update.featureToggles)
  const overrideEnabled = !!update.enabled

  // Encrypt-or-clear the API key independently of featuresEnabled so the
  // user can drop their key without flipping the master toggle off.
  let apiKeyEncrypted = existing.apiKeyEncrypted || null
  if (typeof update.apiKey === 'string') {
    apiKeyEncrypted = update.apiKey.length === 0 ? null : SecretBox.encrypt(update.apiKey)
  }

  // Provider config defaults: preserve existing values when the user isn't
  // submitting a new one.
  let provider = existing.provider || null
  let model = existing.model || null
  let baseUrl = existing.baseUrl || null

  if (featuresEnabled && update.provider) {
    // User submitted a provider — sanitise + validate at the level
    // appropriate for the override flag.
    provider = sanitiseProvider(update.provider)
    const isFixedEndpoint = provider === ProviderRegistry.providers.vercelAiSdk
    model = isFixedEndpoint ? 'vercel-ai-sdk' : (update.model || '').trim() || null
    baseUrl = update.baseUrl ? String(update.baseUrl).trim() : null
    if (overrideEnabled) {
      if (!model && !isFixedEndpoint) throw new SystemError('aiModelMissing', { provider })
      const requiresBaseUrl =
        provider === ProviderRegistry.providers.openaiCompatible || provider === ProviderRegistry.providers.vercelAiSdk
      if (requiresBaseUrl && !baseUrl) {
        throw new SystemError('aiBaseUrlMissing', { provider })
      }
    }
  }

  const newAi = {
    featuresEnabled,
    featureToggles,
    provider,
    model,
    baseUrl,
    apiKeyEncrypted,
    enabled: overrideEnabled,
    // Saving invalidates the previous test result.
    lastTestOk: null,
    lastTestAt: existing.lastTestAt || null,
  }

  const prefs = User.getPrefs(user) || {}
  const newPrefs = { ...prefs, [PREFS_KEY]: newAi }
  const userUpdated = { ...user, prefs: newPrefs }

  await UserManager.updateUserPrefs(userUpdated)
  return userUpdated
}

/**
 * Removes the user's AI override. Subsequent AI calls will fall through to
 * the admin default.
 * @param {object} args - Args.
 * @param {object} args.user - The user.
 * @returns {Promise<object>} The new public settings descriptor (all empty).
 */
export const clearSettings = async ({ user }) => {
  const prefs = User.getPrefs(user) || {}
  if (!prefs[PREFS_KEY]) return user
  const rest = { ...prefs }
  delete rest[PREFS_KEY]
  const userUpdated = { ...user, prefs: rest }
  await UserManager.updateUserPrefs(userUpdated)
  return userUpdated
}

/**
 * Issues a tiny "say ok" call to the configured provider so the user knows
 * their key works before relying on it. Stamps `lastTestOk` / `lastTestAt`
 * on success and on failure so the AI Settings UI can surface staleness.
 *
 * When draft params (provider, model, baseUrl, apiKey) are supplied they take
 * precedence over the persisted config so the UI can test unsaved changes.
 * If apiKey is omitted the saved encrypted key is used as a fallback.
 * @param {object} args - Args.
 * @param {object} args.user - The user.
 * @param {string} [args.provider] - Draft provider (overrides saved config).
 * @param {string} [args.model] - Draft model.
 * @param {string} [args.baseUrl] - Draft base URL.
 * @param {string} [args.apiKey] - Draft API key (falls back to saved key when omitted).
 * @returns {Promise<{ok: boolean, latencyMs: number, errorMessage?: string}>} Test result.
 */
export const testConnection = async ({ user, provider, model, baseUrl, apiKey }) => {
  let cfg
  if (provider) {
    sanitiseProvider(provider)
    let effectiveApiKey = typeof apiKey === 'string' && apiKey.length > 0 ? apiKey : null
    if (!effectiveApiKey) {
      const raw = getRawPrefs(user)
      if (raw?.apiKeyEncrypted) {
        try {
          effectiveApiKey = SecretBox.decrypt(raw.apiKeyEncrypted)
        } catch {
          effectiveApiKey = null
        }
      }
    }
    cfg = { provider, model: model || null, baseUrl: baseUrl || null, apiKey: effectiveApiKey }
  } else {
    cfg = getEffectiveUserConfig(user)
  }
  if (!cfg) {
    return { ok: false, latencyMs: 0, errorMessage: 'No personal provider configured' }
  }
  const start = Date.now()
  try {
    const model = ProviderRegistry.buildModel(cfg)
    await generateText({
      model,
      prompt: 'Reply with the single word: ok',
      maxOutputTokens: 5,
    })
    const latencyMs = Date.now() - start
    await stampTestResult({ user, ok: true })
    return { ok: true, latencyMs }
  } catch (error) {
    const latencyMs = Date.now() - start
    await stampTestResult({ user, ok: false })
    return { ok: false, latencyMs, errorMessage: error?.message || String(error) }
  }
}

/**
 * List the models offered by the given provider, so the AI Settings panel
 * can populate the Model field as a dropdown instead of free-text.
 *
 * If `apiKey` is omitted/empty but the user already has a saved encrypted
 * key, that saved key is decrypted and used — this lets the panel
 * auto-fetch on blur without forcing the user to re-enter the key on every
 * edit.
 * @param {object} args - Args.
 * @param {object} args.user - Arena user.
 * @param {string} args.provider - Provider key.
 * @param {string} [args.baseUrl] - Base URL (for openai-compatible / Vercel AI SDK).
 * @param {string} [args.apiKey] - API key from the form, if any.
 * @returns {Promise<{models: Array<{id: string, description?: string}>}>} Models.
 */
export const listModels = async ({ user, provider, baseUrl, apiKey }) => {
  sanitiseProvider(provider)
  let effectiveApiKey = typeof apiKey === 'string' && apiKey.length > 0 ? apiKey : null
  if (!effectiveApiKey) {
    const raw = getRawPrefs(user)
    if (raw?.apiKeyEncrypted) {
      try {
        effectiveApiKey = SecretBox.decrypt(raw.apiKeyEncrypted)
      } catch {
        effectiveApiKey = null
      }
    }
  }
  const trimmedBaseUrl = baseUrl ? String(baseUrl).trim() : null
  const models = await ModelDiscovery.listForProvider({
    provider,
    baseUrl: trimmedBaseUrl,
    apiKey: effectiveApiKey,
  })
  return { models }
}

const stampTestResult = async ({ user, ok }) => {
  const prefs = User.getPrefs(user) || {}
  const existing = prefs[PREFS_KEY]
  if (!existing) return
  const newAi = { ...existing, lastTestOk: ok, lastTestAt: new Date().toISOString() }
  const userUpdated = { ...user, prefs: { ...prefs, [PREFS_KEY]: newAi } }
  await UserManager.updateUserPrefs(userUpdated)
}
