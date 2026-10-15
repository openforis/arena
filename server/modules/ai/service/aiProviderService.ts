/**
 * Account AI providers of a user (`user.prefs.ai.providers`): test, list models, add, edit, remove and choose the
 * default. A saved API key only ever goes back to the endpoint it was saved with: a draft (no id) never uses one, and
 * a saved provider uses its key only while its type and base URL are unchanged. Every write is a change of the latest
 * stored provider prefs (see aiPrefsWriter), never a save of the copy read when the request began.
 */
import { generateText } from 'ai'
import type { User } from '@openforis/arena-core'

import { ENV } from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import { uuidv4 } from '@core/uuid'
import { AiProvider } from '@common/ai/aiProvider'
import {
  ARENA_DEFAULT_PROVIDER_ID,
  createAccountProviderId,
  isAccountProviderId,
  isAiProviderId,
  normalizeProviderName,
} from '@common/ai/providerIds'
import * as Log from '@server/log/log'
import type { AiPrefsUpdate, StoredAiPrefs } from '@server/modules/user/repository/userAiPrefsRepository'
import * as SecretBox from '@server/utils/crypto/secretBox'

import { formatErrorForLog, toAiSystemError } from './gateway/errorMapping'
import {
  assertFieldLengths,
  assertProviderCountBelowLimit,
  decryptStoredKey,
  encryptProviderKey,
  type AiProviderPrefs,
  findStoredProvider,
  getProviderPrefs,
  isSameEndpoint,
  type KeyCipher,
  type PublicAiProvider,
  providerTypeUsesBaseUrl,
  type StoredAiProvider,
  toPublicProvider,
  trimmedOrNull,
  withProviderPrefs,
  hasLegacyKeys,
} from './aiProviderPrefs'
import { type AiPrefsWriterDeps, changeAiPrefs, createDefaultAiPrefsWriterDeps } from './aiPrefsWriter'
import * as AiTelemetry from './aiTelemetry'
import { getAiPrefs } from './aiUserPrefs'
import { getProviderHostingClass } from './hostingClass'
import { MOCK_PROVIDER } from './mockProvider'
import * as ModelDiscovery from './modelDiscovery'
import * as ProviderRegistry from './providerRegistry'
import * as ProviderResolver from './providerResolver'

export type AiProviderCallConfig = {
  provider: string
  model: string | null
  baseUrl: string | null
  apiKey: string | null
}

// a failed test carries an error key and params only: nothing the provider or the network said is sent on
export type AiProviderTestResult = {
  ok: boolean
  latencyMs: number
  errorKey?: string
  errorParams?: Record<string, unknown>
}

export type AiProviderModel = { id: string; description?: string }

export type AiProviderInput = {
  id?: unknown
  type?: unknown
  name?: unknown
  model?: unknown
  baseUrl?: unknown
  apiKey?: unknown
}

export type AiProviderServiceDeps = {
  updateAiPrefs: (userUuid: string, update: AiPrefsUpdate) => Promise<StoredAiPrefs | null>
  runTest: (args: { user: User; cfg: AiProviderCallConfig }) => Promise<AiProviderTestResult>
  listModels: (cfg: AiProviderCallConfig) => Promise<AiProviderModel[]>
  encrypt: KeyCipher['encrypt']
  decrypt: KeyCipher['decrypt']
  isLegacyEnvelope: KeyCipher['isLegacy']
  isEncryptionConfigured: () => boolean
  hasAdminDefault: () => boolean
  isMockEnabled: () => boolean
  newId: () => string
  now: () => string
  allowlist: string[]
  findCopiedEnvelopes: AiPrefsWriterDeps['findCopiedEnvelopes']
}

type ProviderPrefsChange = (latest: AiProviderPrefs) => AiProviderPrefs | null

type ResolvedCallConfig = { cfg: AiProviderCallConfig; saved: StoredAiProvider | null; sameEndpoint: boolean }

const logger = Log.getLogger('AiProviders')

// the providers that refuse a call without an API key
// the answer to "say ok" is tiny: a connection test reads at most this much, whatever the endpoint sends
const TEST_MAX_BODY_BYTES = 1024 * 1024

const KEY_REQUIRED_TYPES = new Set<string>([AiProvider.openai, AiProvider.anthropic, AiProvider.google])

/**
 * Builds the 404 of a provider id that is not the user's (or not an id at all).
 * @param {unknown} providerId - Requested id.
 * @returns {SystemError} The error.
 */
const notFound = (providerId: unknown): SystemError =>
  new SystemError('aiProviderNotFound', { providerId: String(providerId).slice(0, 80) }, StatusCodes.NOT_FOUND)

/**
 * Builds a 400 error.
 * @param {string} key - Error key.
 * @param {object} [params] - Error params.
 * @returns {SystemError} The error.
 */
const badRequest = (key: string, params: Record<string, unknown> = {}): SystemError =>
  new SystemError(key, params, StatusCodes.BAD_REQUEST)

/**
 * Returns the result of a test that failed with the error.
 * @param {unknown} error - The error.
 * @param {boolean} [timedOut] - True when the timeout aborted the test.
 * @returns {AiProviderTestResult} The failed result: the key and params of the error as the gateway maps it.
 */
const toFailedResult = (error: unknown, timedOut = false): AiProviderTestResult => {
  const systemError = toAiSystemError(error, { timedOut })
  return { ok: false, latencyMs: 0, errorKey: systemError.key, errorParams: systemError.params }
}

/**
 * Sends a tiny "say ok" call to the provider (through the guarded builder: SSRF checks, no redirects).
 * @param {object} params - Parameters.
 * @param {User} params.user - Acting user (telemetry).
 * @param {AiProviderCallConfig} params.cfg - Provider config with its key.
 * @returns {Promise<AiProviderTestResult>} The result; never throws.
 */
const runConnectionTest = async ({ user, cfg }: { user: User; cfg: AiProviderCallConfig }) => {
  const start = Date.now()
  // an endpoint that never answers must not hold the request (and a socket) open
  const abortSignal = AbortSignal.timeout(ENV.aiRequestTimeoutMs)
  try {
    const model = await ProviderRegistry.buildUserModel(cfg, { maxBodyBytes: TEST_MAX_BODY_BYTES })
    const ctx = {
      feature: 'testConnection',
      source: 'user',
      provider: cfg.provider,
      model: cfg.model,
      userUuid: user.uuid,
    }
    await AiTelemetry.track(ctx, () =>
      generateText({ model, prompt: 'Reply with the single word: ok', maxOutputTokens: 16, maxRetries: 0, abortSignal })
    )
    return { ok: true, latencyMs: Date.now() - start }
  } catch (error) {
    // the details stay in the server log
    if (!(error instanceof SystemError)) logger.warn(formatErrorForLog('testConnection', error))
    return { ...toFailedResult(error, abortSignal.aborted), latencyMs: Date.now() - start }
  }
}

/**
 * Returns the default dependencies: the database, real provider calls and the server encryption secret.
 * @returns {AiProviderServiceDeps} The dependencies.
 */
export const createDefaultAiProviderServiceDeps = (): AiProviderServiceDeps => ({
  updateAiPrefs: createDefaultAiPrefsWriterDeps().updateAiPrefs,
  runTest: runConnectionTest,
  /**
   * Lists the models of a provider through the guarded discovery.
   * @param {AiProviderCallConfig} cfg - Call config.
   * @returns {Promise<AiProviderModel[]>} The models.
   */
  listModels: (cfg) =>
    ModelDiscovery.listForProvider({ provider: cfg.provider, baseUrl: cfg.baseUrl, apiKey: cfg.apiKey }),
  encrypt: SecretBox.encrypt,
  decrypt: SecretBox.decrypt,
  isLegacyEnvelope: SecretBox.isLegacyEnvelope,
  isEncryptionConfigured: SecretBox.isConfigured,
  /**
   * Returns true when the admin has configured the Arena default provider.
   * @returns {boolean} Whether there is an admin default.
   */
  hasAdminDefault: () => ProviderResolver.describeAdminDefault() !== null,
  /**
   * Returns true on test servers that accept the mock provider.
   * @returns {boolean} Whether the mock provider is enabled.
   */
  isMockEnabled: () => !!ENV.aiMockProviderEnabled,
  newId: uuidv4,
  /**
   * Returns the current time.
   * @returns {string} ISO timestamp.
   */
  now: () => new Date().toISOString(),
  allowlist: ENV.aiOrgHostedBaseUrls ?? [],
  findCopiedEnvelopes: createDefaultAiPrefsWriterDeps().findCopiedEnvelopes,
})

/**
 * Returns the type when it can be stored (the mock only on test servers), else throws aiProviderInvalid.
 * @param {unknown} type - Requested type (untrusted).
 * @param {AiProviderServiceDeps} deps - Dependencies.
 * @returns {string} The type.
 */
const assertType = (type: unknown, deps: AiProviderServiceDeps): string => {
  const valid =
    typeof type === 'string' && (ProviderRegistry.isSupported(type) || (type === MOCK_PROVIDER && deps.isMockEnabled()))
  if (!valid) throw badRequest('aiProviderInvalid', { provider: String(type).slice(0, 64) })
  return type
}

/**
 * Returns the user's provider with the id, else throws a 404 (the ownership check of every saved-provider operation).
 * @param {AiProviderPrefs} prefs - The user's provider prefs.
 * @param {unknown} id - Requested id (untrusted).
 * @returns {StoredAiProvider} The provider.
 */
const findOwnProvider = (prefs: AiProviderPrefs, id: unknown): StoredAiProvider => {
  const stored = isAccountProviderId(id) ? findStoredProvider(prefs, id) : null
  if (!stored) throw notFound(id)
  return stored
}

/**
 * Returns the model of the call: the input's when sent, else the saved one.
 * @param {string} type - Provider type.
 * @param {AiProviderInput} input - Request input.
 * @param {StoredAiProvider|null} saved - Saved provider, if any.
 * @returns {string|null} The model.
 */
const pickModel = (type: string, input: AiProviderInput, saved: StoredAiProvider | null): string | null => {
  // the Vercel AI SDK endpoint has no model choice
  if (type === AiProvider.vercelAiSdk) return AiProvider.vercelAiSdk
  return input.model === undefined ? (saved?.model ?? null) : trimmedOrNull(input.model)
}

/**
 * Returns the base URL of the call: the input's when sent, else the saved one; null for fixed-URL types.
 * @param {string} type - Provider type.
 * @param {AiProviderInput} input - Request input.
 * @param {StoredAiProvider|null} saved - Saved provider, if any.
 * @returns {string|null} The base URL.
 */
const pickBaseUrl = (type: string, input: AiProviderInput, saved: StoredAiProvider | null): string | null => {
  if (!providerTypeUsesBaseUrl(type)) return null
  return input.baseUrl === undefined ? (saved?.baseUrl ?? null) : trimmedOrNull(input.baseUrl)
}

/**
 * Resolves the config of a call from a draft (no id) or a saved provider plus changed fields. The stored key is not
 * read here (see {@link withStoredKey}), so an edit that never needs it cannot fail on an unreadable one.
 * @param {object} params - Parameters.
 * @param {AiProviderPrefs} params.prefs - The user's provider prefs.
 * @param {AiProviderInput} params.input - Request input (untrusted).
 * @param {AiProviderServiceDeps} params.deps - Dependencies.
 * @returns {ResolvedCallConfig} The config with the typed key only, the saved provider and whether the endpoint is unchanged.
 */
const resolveCallConfig = ({
  prefs,
  input,
  deps,
}: {
  prefs: AiProviderPrefs
  input: AiProviderInput
  deps: AiProviderServiceDeps
}): ResolvedCallConfig => {
  const saved = input.id === undefined || input.id === null ? null : findOwnProvider(prefs, input.id)
  const type = assertType(input.type ?? saved?.type, deps)
  const model = pickModel(type, input, saved)
  // a submitted base URL is trimmed like the stored one, so a stray space does not look like a new endpoint
  const baseUrl = pickBaseUrl(type, input, saved)
  const sameEndpoint = !!saved && saved.type === type && isSameEndpoint(saved.baseUrl, baseUrl)
  return { cfg: { provider: type, model, baseUrl, apiKey: trimmedOrNull(input.apiKey) }, saved, sameEndpoint }
}

/**
 * Adds the stored key to a resolved config: only to the endpoint it was saved with, and only when no key was typed
 * (an empty string means "no key").
 * @param {object} params - Parameters.
 * @param {ResolvedCallConfig} params.resolved - Resolved call config.
 * @param {AiProviderInput} params.input - Request input.
 * @param {User} params.user - The user (the stored key is bound to them).
 * @param {AiProviderServiceDeps} params.deps - Dependencies.
 * @returns {ResolvedCallConfig} The config with the key.
 */
const withStoredKey = ({
  resolved,
  input,
  user,
  deps,
}: {
  resolved: ResolvedCallConfig
  input: AiProviderInput
  user: User
  deps: AiProviderServiceDeps
}): ResolvedCallConfig => {
  const { saved, sameEndpoint, cfg } = resolved
  if (!saved || !sameEndpoint || input.apiKey !== undefined) return resolved
  return { ...resolved, cfg: { ...cfg, apiKey: decryptStoredKey(saved, user.uuid, deps.decrypt, deps.allowlist) } }
}

/**
 * Throws when a provider that needs a key has none.
 * @param {AiProviderCallConfig} cfg - Call config.
 * @returns {void}
 */
const assertKeyPresent = (cfg: AiProviderCallConfig): void => {
  if (KEY_REQUIRED_TYPES.has(cfg.provider) && !cfg.apiKey)
    throw badRequest('aiApiKeyMissing', { provider: cfg.provider })
}

/**
 * Throws when the config lacks a model or a required base URL.
 * @param {AiProviderCallConfig} cfg - Call config.
 * @returns {void}
 */
const assertCompleteConfig = (cfg: AiProviderCallConfig): void => {
  if (!cfg.model) throw badRequest('aiModelMissing', { provider: cfg.provider })
  if (providerTypeUsesBaseUrl(cfg.provider) && !cfg.baseUrl)
    throw badRequest('aiBaseUrlMissing', { provider: cfg.provider })
}

/**
 * Throws when the config cannot make a call (model, base URL, key).
 * @param {AiProviderCallConfig} cfg - Call config.
 * @returns {void}
 */
const validateConfig = (cfg: AiProviderCallConfig): void => {
  assertCompleteConfig(cfg)
  assertKeyPresent(cfg)
}

/**
 * Returns true when the call uses exactly the saved values of a saved provider (same model, endpoint and key).
 * @param {ResolvedCallConfig} resolved - Resolved call config.
 * @param {AiProviderInput} input - Request input.
 * @returns {boolean} Whether the saved values are used.
 */
const usesSavedValues = (resolved: ResolvedCallConfig, input: AiProviderInput): boolean =>
  !!resolved.saved && resolved.sameEndpoint && resolved.saved.model === resolved.cfg.model && input.apiKey === undefined

/**
 * Returns the provider prefs with one provider replaced.
 * @param {AiProviderPrefs} prefs - Provider prefs.
 * @param {StoredAiProvider} provider - Updated provider (same id).
 * @returns {AiProviderPrefs} The new prefs.
 */
const replaceProvider = (prefs: AiProviderPrefs, provider: StoredAiProvider): AiProviderPrefs => ({
  ...prefs,
  providers: prefs.providers.map((existing) => (existing.id === provider.id ? provider : existing)),
})

/**
 * Returns the secret box of the dependencies.
 * @param {AiProviderServiceDeps} deps - Dependencies.
 * @returns {KeyCipher} The secret box.
 */
const cipherOf = (deps: AiProviderServiceDeps): KeyCipher => ({
  encrypt: deps.encrypt,
  decrypt: deps.decrypt,
  isLegacy: deps.isLegacyEnvelope,
})

/**
 * Returns the dependencies of the AI prefs writer.
 * @param {AiProviderServiceDeps} deps - Dependencies.
 * @returns {AiPrefsWriterDeps} The writer dependencies.
 */
const writerDepsOf = (deps: AiProviderServiceDeps): AiPrefsWriterDeps => ({
  updateAiPrefs: deps.updateAiPrefs,
  cipher: cipherOf(deps),
  isEncryptionConfigured: deps.isEncryptionConfigured,
  allowlist: deps.allowlist,
  findCopiedEnvelopes: deps.findCopiedEnvelopes,
})

/**
 * Changes the latest stored provider prefs of the user (the old slot keys are dropped). The change runs while the
 * user row is locked: it must not wait for the network and may throw to refuse the write.
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {ProviderPrefsChange} params.change - Receives the latest provider prefs, returns the ones to store (or null).
 * @param {AiProviderServiceDeps} params.deps - Dependencies.
 * @returns {Promise<{user: User, prefs: AiProviderPrefs}>} The user and the provider prefs as stored.
 */
const commitProviderPrefs = async ({
  user,
  change,
  deps,
}: {
  user: User
  change: ProviderPrefsChange
  deps: AiProviderServiceDeps
}): Promise<{ user: User; prefs: AiProviderPrefs }> => {
  const updated = await changeAiPrefs({
    user,
    deps: writerDepsOf(deps),
    change: (latest) => {
      const next = change(getProviderPrefs(latest))
      return next ? withProviderPrefs(latest, next) : null
    },
  })
  return { user: updated, prefs: getProviderPrefs(getAiPrefs(updated)) }
}

/**
 * Returns true when two stored providers have the values a test is about: type, model, endpoint and key.
 * @param {StoredAiProvider} current - The stored provider.
 * @param {StoredAiProvider} tested - The provider as it was when the test began.
 * @param {boolean} [ignoreKey] - True when the request replaces the key, so the stored one is not compared.
 * @returns {boolean} Whether the test is still about what is stored.
 */
const isSameTestedProvider = (current: StoredAiProvider, tested: StoredAiProvider, ignoreKey = false): boolean =>
  current.type === tested.type &&
  current.model === tested.model &&
  isSameEndpoint(current.baseUrl, tested.baseUrl) &&
  (ignoreKey || current.apiKeyEncrypted === tested.apiKeyEncrypted)

/**
 * Stamps the result of a test on the stored provider, unless it was removed or edited while the test ran (the
 * result is then about something that is no longer stored).
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {StoredAiProvider} params.tested - The provider as it was when the test began.
 * @param {boolean} params.ok - Whether the test passed.
 * @param {AiProviderServiceDeps} params.deps - Dependencies.
 * @returns {Promise<void>} Resolves when done.
 */
const stampTestResult = async ({
  user,
  tested,
  ok,
  deps,
}: {
  user: User
  tested: StoredAiProvider
  ok: boolean
  deps: AiProviderServiceDeps
}): Promise<void> => {
  const lastTestAt = deps.now()
  await commitProviderPrefs({
    user,
    deps,
    change: (latest) => {
      const current = findStoredProvider(latest, tested.id)
      if (!current || !isSameTestedProvider(current, tested)) return null
      return replaceProvider(latest, { ...current, lastTestOk: ok, lastTestAt })
    },
  })
}

/**
 * Encrypts a key to store, bound to the user and the provider; throws aiEncryptionMissing when the server has no secret.
 * @param {object} params - Parameters.
 * @param {string|null} params.apiKey - Plain key.
 * @param {User} params.user - The user that owns the provider.
 * @param {object} params.provider - The provider as it will be stored (id, type and base URL).
 * @param {AiProviderServiceDeps} params.deps - Dependencies.
 * @returns {string|null} The encrypted key, or null when there is no key.
 */
const encryptKey = ({
  apiKey,
  user,
  provider,
  deps,
}: {
  apiKey: string | null
  user: User
  provider: Pick<StoredAiProvider, 'id' | 'type' | 'baseUrl'>
  deps: AiProviderServiceDeps
}): string | null => {
  if (!apiKey) return null
  if (!deps.isEncryptionConfigured()) throw new SystemError('aiEncryptionMissing', {}, StatusCodes.CONFLICT)
  return encryptProviderKey({ apiKey, userUuid: user.uuid, provider, cipher: deps })
}

/**
 * Runs the test and throws its error when it fails (add and edit save only a working provider).
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {AiProviderCallConfig} params.cfg - Call config.
 * @param {AiProviderServiceDeps} params.deps - Dependencies.
 * @returns {Promise<void>} Resolves when the test passed.
 */
const assertTestPasses = async ({
  user,
  cfg,
  deps,
}: {
  user: User
  cfg: AiProviderCallConfig
  deps: AiProviderServiceDeps
}) => {
  const result = await deps.runTest({ user, cfg })
  if (result.ok) return
  throw badRequest(result.errorKey ?? 'aiProviderUnavailable', result.errorParams ?? {})
}

/**
 * Returns true when the stored key can be decrypted.
 * @param {StoredAiProvider} provider - Stored provider.
 * @param {string} userUuid - The user that owns the provider.
 * @param {AiProviderServiceDeps} deps - Dependencies.
 * @returns {boolean} Whether the key is readable (false when there is none).
 */
const isKeyReadable = (provider: StoredAiProvider, userUuid: string, deps: AiProviderServiceDeps): boolean => {
  if (!provider.apiKeyEncrypted) return false
  try {
    decryptStoredKey(provider, userUuid, deps.decrypt, deps.allowlist)
    return true
  } catch {
    return false
  }
}

/**
 * Returns the public entry of a stored provider.
 * @param {StoredAiProvider} provider - Stored provider.
 * @param {string} userUuid - The user that owns the provider.
 * @param {AiProviderServiceDeps} deps - Dependencies.
 * @returns {PublicAiProvider} The entry.
 */
const toPublic = (provider: StoredAiProvider, userUuid: string, deps: AiProviderServiceDeps): PublicAiProvider =>
  toPublicProvider({
    provider,
    hostingClass: getProviderHostingClass({
      provider: provider.type,
      baseUrl: provider.baseUrl,
      allowlist: deps.allowlist,
    }),
    apiKeyReadable: isKeyReadable(provider, userUuid, deps),
  })

/**
 * Returns the public entries of the user's account providers.
 * @param {User} user - The user.
 * @param {AiProviderServiceDeps} [deps] - Dependencies.
 * @returns {PublicAiProvider[]} The entries, in stored order.
 */
export const getPublicProviders = (
  user: User,
  deps: AiProviderServiceDeps = createDefaultAiProviderServiceDeps()
): PublicAiProvider[] =>
  getProviderPrefs(getAiPrefs(user)).providers.map((provider) => toPublic(provider, user.uuid, deps))

/**
 * Returns the input with a single meaning of "key sent": a string (an empty one clears the key); anything else, such
 * as null or whitespace only, is "not sent" and keeps the stored key.
 * @param {AiProviderInput} input - Request input (untrusted).
 * @returns {AiProviderInput} The input with a normalised `apiKey`.
 * @throws {SystemError} aiProviderFieldTooLong when the model, base URL or key is over its limit.
 */
const normalizeInput = (input: AiProviderInput): AiProviderInput => {
  assertFieldLengths(input)
  const { apiKey } = input
  const sent = typeof apiKey === 'string' && (apiKey === '' || apiKey.trim() !== '')
  return { ...input, apiKey: sent ? apiKey : undefined }
}

/**
 * Tests a draft or a saved provider; stamps `lastTest*` only for a saved provider tested with its saved values.
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {AiProviderInput} params.input - Draft (`type`, `model`, `baseUrl`, `apiKey`) or `id` plus changed fields.
 * @param {AiProviderServiceDeps} [params.deps] - Dependencies.
 * @returns {Promise<AiProviderTestResult>} The result (an incomplete config is a failed result, not an error).
 */
export const testProvider = async ({
  user,
  input: rawInput,
  deps = createDefaultAiProviderServiceDeps(),
}: {
  user: User
  input: AiProviderInput
  deps?: AiProviderServiceDeps
}): Promise<AiProviderTestResult> => {
  const input = normalizeInput(rawInput)
  const prefs = getProviderPrefs(getAiPrefs(user))
  const resolved = withStoredKey({ resolved: resolveCallConfig({ prefs, input, deps }), input, user, deps })
  try {
    validateConfig(resolved.cfg)
  } catch (error) {
    return toFailedResult(error)
  }
  const result = await deps.runTest({ user, cfg: resolved.cfg })
  if (resolved.saved && usesSavedValues(resolved, input)) {
    await stampTestResult({ user, tested: resolved.saved, ok: result.ok, deps })
  }
  return result
}

/**
 * Lists the models of a draft or a saved provider (same key rules and base URL guard as a call).
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {AiProviderInput} params.input - Draft or `id` plus changed fields.
 * @param {AiProviderServiceDeps} [params.deps] - Dependencies.
 * @returns {Promise<{models: AiProviderModel[]}>} The models.
 */
export const listProviderModels = async ({
  user,
  input: rawInput,
  deps = createDefaultAiProviderServiceDeps(),
}: {
  user: User
  input: AiProviderInput
  deps?: AiProviderServiceDeps
}): Promise<{ models: AiProviderModel[] }> => {
  const input = normalizeInput(rawInput)
  const { cfg } = withStoredKey({
    resolved: resolveCallConfig({ prefs: getProviderPrefs(getAiPrefs(user)), input, deps }),
    input,
    user,
    deps,
  })
  // the mock provider has one model and no endpoint to ask
  if (cfg.provider === MOCK_PROVIDER) return { models: [{ id: MOCK_PROVIDER }] }
  assertKeyPresent(cfg)
  return { models: await deps.listModels(cfg) }
}

/**
 * Adds an account provider: validates, encrypts the key, re-runs the test, saves with a new `acct:` id.
 * The first provider becomes the default when the default is Arena default and no admin default exists.
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {AiProviderInput} params.input - `type`, `name`, `model`, `baseUrl`, `apiKey` (an `id` is ignored).
 * @param {AiProviderServiceDeps} [params.deps] - Dependencies.
 * @returns {Promise<{user: User, provider: PublicAiProvider}>} The updated user and the new entry.
 * @throws {SystemError} aiProviderLimitReached (409) when the user has the most providers that can be saved.
 */
export const addProvider = async ({
  user,
  input: rawInput,
  deps = createDefaultAiProviderServiceDeps(),
}: {
  user: User
  input: AiProviderInput
  deps?: AiProviderServiceDeps
}): Promise<{ user: User; provider: PublicAiProvider }> => {
  const input = normalizeInput(rawInput)
  const prefs = getProviderPrefs(getAiPrefs(user))
  // refused before the provider is tested; the latest providers are checked again when it is saved
  assertProviderCountBelowLimit(prefs.providers)
  // an added provider is always a draft: it never takes the key of a saved one
  const draftInput = { ...input, id: undefined }
  const { cfg } = withStoredKey({
    resolved: resolveCallConfig({ prefs, input: draftInput, deps }),
    input: draftInput,
    user,
    deps,
  })
  validateConfig(cfg)
  const id = createAccountProviderId(deps.newId())
  const apiKeyEncrypted = encryptKey({
    apiKey: cfg.apiKey,
    user,
    provider: { id, type: cfg.provider, baseUrl: cfg.baseUrl },
    deps,
  })
  await assertTestPasses({ user, cfg, deps })
  const provider: StoredAiProvider = {
    id,
    type: cfg.provider,
    name: normalizeProviderName(input.name, cfg.provider),
    model: cfg.model,
    baseUrl: cfg.baseUrl,
    apiKeyEncrypted,
    lastTestOk: true,
    lastTestAt: deps.now(),
  }
  const { user: userUpdated } = await commitProviderPrefs({
    user,
    deps,
    change: (latest) => {
      assertProviderCountBelowLimit(latest.providers)
      const becomesDefault = latest.defaultProviderId === ARENA_DEFAULT_PROVIDER_ID && !deps.hasAdminDefault()
      return {
        ...latest,
        providers: [...latest.providers, provider],
        ...(becomesDefault ? { defaultProviderId: provider.id, defaultProviderOrigin: 'user' as const } : {}),
      }
    },
  })
  return { user: userUpdated, provider: toPublic(provider, user.uuid, deps) }
}

/**
 * Returns the encrypted key to store after an edit: a typed key replaces the stored one ('' clears it); an omitted
 * key stays only on the same endpoint.
 * @param {object} params - Parameters.
 * @param {AiProviderInput} params.input - Request input.
 * @param {ResolvedCallConfig} params.resolved - Resolved call config.
 * @param {StoredAiProvider} params.saved - Saved provider.
 * @param {User} params.user - The user that owns the provider.
 * @param {AiProviderServiceDeps} params.deps - Dependencies.
 * @returns {string|null} The encrypted key.
 */
const keyToStore = ({
  input,
  resolved,
  saved,
  user,
  deps,
}: {
  input: AiProviderInput
  resolved: ResolvedCallConfig
  saved: StoredAiProvider
  user: User
  deps: AiProviderServiceDeps
}): string | null => {
  if (input.apiKey !== undefined) {
    const provider = { id: saved.id, type: saved.type, baseUrl: resolved.cfg.baseUrl }
    return encryptKey({ apiKey: resolved.cfg.apiKey, user, provider, deps })
  }
  return resolved.sameEndpoint ? saved.apiKeyEncrypted : null
}

/**
 * Throws a 409 when the stored provider is no longer the one the edit was tested against (changed by another request
 * while the test ran): saving the tested values would undo that change.
 * @param {object} params - Parameters.
 * @param {StoredAiProvider} params.current - The stored provider.
 * @param {StoredAiProvider} params.tested - The provider as it was when the test began.
 * @param {boolean} params.keyTyped - Whether the request replaces the key.
 * @returns {void}
 */
const assertUnchangedSinceTest = ({
  current,
  tested,
  keyTyped,
}: {
  current: StoredAiProvider
  tested: StoredAiProvider
  keyTyped: boolean
}): void => {
  if (!isSameTestedProvider(current, tested, keyTyped)) {
    throw new SystemError('aiProviderChanged', { providerId: tested.id }, StatusCodes.CONFLICT)
  }
}

/**
 * Tests the values of an edit that changes the model, the endpoint or the key: they are saved only when the test
 * passes. Returns null for an edit that keeps the saved values (a rename), which needs no test.
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {AiProviderInput} params.input - Request input.
 * @param {ResolvedCallConfig} params.unkeyed - Resolved config of the edit, without the stored key.
 * @param {StoredAiProvider} params.saved - The provider as stored when the request began.
 * @param {AiProviderServiceDeps} params.deps - Dependencies.
 * @returns {Promise<Partial<StoredAiProvider>|null>} The tested values to store, or null when nothing was tested.
 */
const testEditedValues = async ({
  user,
  input,
  unkeyed,
  saved,
  deps,
}: {
  user: User
  input: AiProviderInput
  unkeyed: ResolvedCallConfig
  saved: StoredAiProvider
  deps: AiProviderServiceDeps
}): Promise<Partial<StoredAiProvider> | null> => {
  if (usesSavedValues(unkeyed, input)) return null
  const resolved = withStoredKey({ resolved: unkeyed, input, user, deps })
  validateConfig(resolved.cfg)
  const apiKeyEncrypted = keyToStore({ input, resolved, saved, user, deps })
  await assertTestPasses({ user, cfg: resolved.cfg, deps })
  return {
    model: resolved.cfg.model,
    baseUrl: resolved.cfg.baseUrl,
    apiKeyEncrypted,
    lastTestOk: true,
    lastTestAt: deps.now(),
  }
}

/**
 * Edits a provider: a name-only change saves at once; a changed model, base URL or key needs a passing test.
 * The type never changes (another type is another provider). The edit is applied to the stored provider: a provider
 * removed or changed by another request while the test ran is a 404 or a 409, never a silent overwrite.
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {string} params.id - Provider id (route parameter, untrusted).
 * @param {AiProviderInput} params.input - Changed fields (`apiKey` omitted = keep).
 * @param {AiProviderServiceDeps} [params.deps] - Dependencies.
 * @returns {Promise<{user: User, provider: PublicAiProvider}>} The updated user and entry.
 */
export const updateProvider = async ({
  user,
  id,
  input: rawInput,
  deps = createDefaultAiProviderServiceDeps(),
}: {
  user: User
  id: unknown
  input: AiProviderInput
  deps?: AiProviderServiceDeps
}): Promise<{ user: User; provider: PublicAiProvider }> => {
  const input = normalizeInput(rawInput)
  const prefs = getProviderPrefs(getAiPrefs(user))
  const saved = findOwnProvider(prefs, id)
  const unkeyed = resolveCallConfig({ prefs, input: { ...input, id: saved.id, type: saved.type }, deps })
  const tested = await testEditedValues({ user, input, unkeyed, saved, deps })
  const { user: userUpdated, prefs: committed } = await commitProviderPrefs({
    user,
    deps,
    change: (latest) => {
      const current = findOwnProvider(latest, saved.id)
      if (tested) assertUnchangedSinceTest({ current, tested: saved, keyTyped: input.apiKey !== undefined })
      const name = input.name === undefined ? current.name : normalizeProviderName(input.name, current.type)
      return replaceProvider(latest, { ...current, ...tested, name })
    },
  })
  return { user: userUpdated, provider: toPublic(findOwnProvider(committed, saved.id), user.uuid, deps) }
}

/**
 * Removes a provider; a removed default becomes Arena default.
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {string} params.id - Provider id (route parameter, untrusted).
 * @param {AiProviderServiceDeps} [params.deps] - Dependencies.
 * @returns {Promise<{user: User}>} The updated user.
 */
export const removeProvider = async ({
  user,
  id,
  deps = createDefaultAiProviderServiceDeps(),
}: {
  user: User
  id: unknown
  deps?: AiProviderServiceDeps
}): Promise<{ user: User }> => {
  // refused before the database when the id is not even in the copy of the user read for this request
  findOwnProvider(getProviderPrefs(getAiPrefs(user)), id)
  const { user: userUpdated } = await commitProviderPrefs({
    user,
    deps,
    change: (latest) => {
      const saved = findOwnProvider(latest, id)
      const wasDefault = latest.defaultProviderId === saved.id
      return {
        ...latest,
        providers: latest.providers.filter((provider) => provider.id !== saved.id),
        ...(wasDefault ? { defaultProviderId: ARENA_DEFAULT_PROVIDER_ID, defaultProviderOrigin: 'user' as const } : {}),
      }
    },
  })
  return { user: userUpdated }
}

/**
 * Sets the default provider. `acct:` ids must be the user's; `local:` ids live in a browser, so only their format is
 * checked; `arena-default` is always accepted. With `origin: 'converted'` (the conversion of the old local settings)
 * it applies only while the origin is still 'converted', so a default the user picked is never overwritten.
 * @param {object} params - Parameters.
 * @param {User} params.user - The user.
 * @param {unknown} params.providerId - Provider id (untrusted).
 * @param {unknown} [params.origin] - 'converted' for the conversion call; anything else is a user choice.
 * @param {AiProviderServiceDeps} [params.deps] - Dependencies.
 * @returns {Promise<{user: User, applied: boolean}>} The user and whether the default changed.
 */
export const setDefaultProvider = async ({
  user,
  providerId,
  origin = undefined,
  deps = createDefaultAiProviderServiceDeps(),
}: {
  user: User
  providerId: unknown
  origin?: unknown
  deps?: AiProviderServiceDeps
}): Promise<{ user: User; applied: boolean }> => {
  if (!isAiProviderId(providerId)) throw notFound(providerId)
  let applied = false
  const { user: userUpdated } = await commitProviderPrefs({
    user,
    deps,
    change: (latest) => {
      if (isAccountProviderId(providerId)) findOwnProvider(latest, providerId)
      applied = origin !== 'converted' || latest.defaultProviderOrigin === 'converted'
      if (!applied) return null
      return {
        ...latest,
        defaultProviderId: providerId,
        defaultProviderOrigin: origin === 'converted' ? 'converted' : 'user',
      }
    },
  })
  return { user: userUpdated, applied }
}

/**
 * Encrypts again, with their AAD, the keys of the user's providers that were saved without one. Best effort: a
 * failure is logged and the user is returned as it was, so a settings read never fails because of it.
 * @param {object} params - Parameters.
 * @param {User} params.user - The user (as loaded for this request).
 * @param {AiProviderServiceDeps} [params.deps] - Dependencies.
 * @returns {Promise<User>} The user with the stored AI prefs (the same user when there was nothing to do).
 */
export const upgradeLegacyProviderKeys = async ({
  user,
  deps = createDefaultAiProviderServiceDeps(),
}: {
  user: User
  deps?: AiProviderServiceDeps
}): Promise<User> => {
  const hasOldKeys = hasLegacyKeys(getProviderPrefs(getAiPrefs(user)), deps.isLegacyEnvelope, deps.allowlist)
  if (!hasOldKeys || !deps.isEncryptionConfigured()) return user
  try {
    return (await commitProviderPrefs({ user, deps, change: () => null })).user
  } catch (error) {
    logger.warn(`Could not encrypt the old provider keys of a user again: ${(error as Error).message}`)
    return user
  }
}
