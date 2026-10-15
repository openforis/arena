import { buildKeyAad } from '@server/modules/ai/service/aiProviderPrefs'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { createAiPrefsStore } from '@test/unit/utils/aiPrefsStoreTestUtils'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { CYRILLIC, CYRILLIC_LANGUAGES, LANGUAGES, namespaceByLanguage } from '../utils/i18nParity'

const SECRET = 'd'.repeat(64)
const USER_UUID = 'u1'
const NOW = '2026-10-14T10:00:00.000Z'

/**
 * Encrypts a key the way the service stores it: bound to the user, the provider id, its type and its endpoint.
 * @param {object} provider - The provider (id, type, baseUrl).
 * @param {string} plain - The key.
 * @returns {string} The stored ciphertext.
 */
const sealed = (provider: { id: string; type: string; baseUrl: string | null }, plain: string): string =>
  SecretBox.encrypt(plain, buildKeyAad({ userUuid: USER_UUID, provider }))

/**
 * Opens the stored key of a provider.
 * @param {object} provider - The stored provider.
 * @returns {string} The key.
 */
const opened = (provider: any): string =>
  SecretBox.decrypt(provider.apiKeyEncrypted, buildKeyAad({ userUuid: USER_UUID, provider }))

let savedOpenAi: any
let savedCompatible: any

/**
 * Builds a user with the AI prefs.
 * @param {object} ai - AI prefs to merge.
 * @returns {any} The user.
 */
const userWith = (ai: Record<string, unknown>): any => ({
  uuid: USER_UUID,
  prefs: { ai: { accessLevel: 1, featuresEnabled: true, ...ai } },
})
/**
 * Builds a user with two saved providers, the first one the default.
 * @param {object} [extra] - AI prefs to override.
 * @returns {any} The user.
 */
const userWithProviders = (extra: Record<string, unknown> = {}) =>
  userWith({
    defaultProviderId: 'acct:own',
    defaultProviderOrigin: 'user',
    providers: [savedOpenAi, savedCompatible],
    ...extra,
  })

/**
 * Builds recording dependencies over an in-memory store of the AI prefs of the user.
 * @param {object} [overrides] - Dependencies to replace.
 * @param {any} [user] - The user whose AI prefs are stored at the start.
 * @returns {object} The dependencies, what they recorded (`saved` is every stored AI prefs value) and the store.
 */
const createDeps = (overrides: Partial<AiProviderService.AiProviderServiceDeps> = {}, user: any = null) => {
  const store = createAiPrefsStore(user?.prefs?.ai ?? null)
  const tests: any[] = []
  const listed: any[] = []
  let ids = 0
  const deps: AiProviderService.AiProviderServiceDeps = {
    updateAiPrefs: store.updateAiPrefs,
    runTest: async ({ cfg }) => {
      tests.push(cfg)
      return { ok: true, latencyMs: 1 }
    },
    listModels: async (cfg) => {
      listed.push(cfg)
      return [{ id: 'm1' }]
    },
    encrypt: SecretBox.encrypt,
    decrypt: SecretBox.decrypt,
    isLegacyEnvelope: SecretBox.isLegacyEnvelope,
    isEncryptionConfigured: () => true,
    hasAdminDefault: () => true,
    isMockEnabled: () => false,
    newId: () => `id-${++ids}`,
    now: () => NOW,
    allowlist: ['https://llm.example.org/v1'],
    findCopiedEnvelopes: store.findCopiedEnvelopes,
    ...overrides,
  }
  return { deps, saved: store.writes, tests, listed, store }
}

describe('AI provider service (261)', () => {
  let originalSecret: string | undefined

  beforeAll(() => {
    originalSecret = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = SECRET
    const own = { id: 'acct:own', type: 'openai', baseUrl: null }
    const org = { id: 'acct:org', type: 'openai-compatible', baseUrl: 'https://llm.example.org/v1' }
    savedOpenAi = {
      ...own,
      name: 'Work',
      model: 'gpt-x',
      apiKeyEncrypted: sealed(own, 'sk-saved'),
      lastTestOk: true,
      lastTestAt: '2026-10-01T00:00:00.000Z',
    }
    savedCompatible = {
      ...org,
      name: 'Org',
      model: 'llama',
      apiKeyEncrypted: sealed(org, 'sk-org'),
      lastTestOk: null,
      lastTestAt: null,
    }
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalSecret
  })

  test('a draft never uses a saved key', async () => {
    const { deps, tests, listed } = createDeps()
    const user = userWithProviders()
    const result = await AiProviderService.testProvider({ user, input: { type: 'openai', model: 'gpt-x' }, deps })
    expect(result).toMatchObject({ ok: false, errorKey: 'aiApiKeyMissing' })
    await expectSystemErrorKey(
      AiProviderService.listProviderModels({ user, input: { type: 'openai' }, deps }),
      'aiApiKeyMissing'
    )
    expect(tests).toEqual([])
    expect(listed).toEqual([])
    // with its own key, only that key is sent
    await AiProviderService.testProvider({ user, input: { type: 'openai', model: 'gpt-x', apiKey: 'sk-typed' }, deps })
    expect(tests).toEqual([{ provider: 'openai', model: 'gpt-x', baseUrl: null, apiKey: 'sk-typed' }])
    // a draft of a keyless type pointing at a saved provider's URL is still sent without a key
    await AiProviderService.testProvider({
      user,
      input: { type: 'openai-compatible', model: 'llama', baseUrl: 'https://llm.example.org/v1' },
      deps,
    })
    expect(tests[1].apiKey).toBeNull()
  })

  test('add never takes a saved key', async () => {
    const { deps, tests, saved } = createDeps()
    const error: any = await expectSystemErrorKey(
      AiProviderService.addProvider({
        user: userWithProviders(),
        input: { id: 'acct:own', type: 'openai', model: 'gpt-x' },
        deps,
      }),
      'aiApiKeyMissing'
    )
    expect(error.statusCode).toBe(400)
    expect(tests).toEqual([])
    expect(saved).toEqual([])
  })

  test('a saved key stays on its endpoint', async () => {
    const user = userWithProviders()
    const { deps, tests } = createDeps({}, user)
    await AiProviderService.testProvider({ user, input: { id: 'acct:org' }, deps })
    // a trailing slash is the same endpoint
    await AiProviderService.testProvider({
      user,
      input: { id: 'acct:org', baseUrl: 'https://llm.example.org/v1/' },
      deps,
    })
    await AiProviderService.testProvider({
      user,
      input: { id: 'acct:org', baseUrl: 'https://evil.example.com/v1' },
      deps,
    })
    expect(tests.map((cfg) => cfg.apiKey)).toEqual(['sk-org', 'sk-org', null])
    // another type is another endpoint: the key must be typed again
    const changedType = await AiProviderService.testProvider({
      user,
      input: { id: 'acct:own', type: 'anthropic', model: 'claude' },
      deps,
    })
    expect(changedType).toMatchObject({ ok: false, errorKey: 'aiApiKeyMissing' })
    expect(tests).toHaveLength(3)
  })

  test('a changed base URL needs the key again', async () => {
    const user = userWithProviders()
    const { deps, saved, tests, store } = createDeps({}, user)
    const moved = await AiProviderService.updateProvider({
      user,
      id: 'acct:org',
      input: { baseUrl: 'https://other.example.org/v1' },
      deps,
    })
    expect(tests[0]).toEqual({
      provider: 'openai-compatible',
      model: 'llama',
      baseUrl: 'https://other.example.org/v1',
      apiKey: null,
    })
    expect(moved.provider).toMatchObject({ baseUrl: 'https://other.example.org/v1', hasApiKey: false })
    expect(saved[0].providers[1].apiKeyEncrypted).toBeNull()
    // same endpoint, model changed: the key stays (from the saved provider again)
    store.set(user.prefs.ai)
    const kept = await AiProviderService.updateProvider({ user, id: 'acct:org', input: { model: 'llama-2' }, deps })
    expect(tests[1].apiKey).toBe('sk-org')
    expect(kept.provider).toMatchObject({ model: 'llama-2', hasApiKey: true })
  })

  test("ids that are not the user's are refused, with nothing written or called", async () => {
    const user = userWithProviders()
    const { deps, tests, saved, listed } = createDeps({}, user)
    const calls = [
      () => AiProviderService.testProvider({ user, input: { id: 'acct:someone-else' }, deps }),
      () => AiProviderService.listProviderModels({ user, input: { id: 'acct:someone-else' }, deps }),
      () => AiProviderService.updateProvider({ user, id: 'acct:someone-else', input: { name: 'x' }, deps }),
      () => AiProviderService.removeProvider({ user, id: 'acct:someone-else', deps }),
      () => AiProviderService.setDefaultProvider({ user, providerId: 'acct:someone-else', deps }),
      () => AiProviderService.testProvider({ user, input: { id: 'local:legacy' }, deps }),
      () => AiProviderService.setDefaultProvider({ user, providerId: 'nope', deps }),
    ]
    for (const call of calls) {
      const error: any = await expectSystemErrorKey(call, 'aiProviderNotFound')
      expect(error.statusCode).toBe(404)
    }
    expect(tests).toEqual([])
    expect(listed).toEqual([])
    expect(saved).toEqual([])
  })

  test('add re-runs the test, encrypts the key and stores a new account id', async () => {
    const { deps, tests, saved } = createDeps({ hasAdminDefault: () => false })
    const { provider, user } = await AiProviderService.addProvider({
      user: userWith({}),
      input: { type: 'anthropic', name: ' Claude ', model: 'claude-x', apiKey: 'sk-new' },
      deps,
    })
    expect(provider).toEqual({
      id: 'acct:id-1',
      type: 'anthropic',
      name: 'Claude',
      model: 'claude-x',
      baseUrl: null,
      hostingClass: 'cloud',
      hasApiKey: true,
      apiKeyReadable: true,
      lastTestOk: true,
      lastTestAt: NOW,
    })
    expect(tests).toEqual([{ provider: 'anthropic', model: 'claude-x', baseUrl: null, apiKey: 'sk-new' }])
    expect(opened(saved[0].providers[0])).toBe('sk-new')
    // no admin default and the default was Arena default: the first provider becomes the default
    expect(saved[0]).toMatchObject({ defaultProviderId: 'acct:id-1', defaultProviderOrigin: 'user' })
    expect((user.prefs as any).ai.providers).toHaveLength(1)
    // with an admin default the default does not change
    const withAdmin = createDeps()
    await AiProviderService.addProvider({
      user: userWith({}),
      input: { type: 'anthropic', model: 'claude-x', apiKey: 'sk-new' },
      deps: withAdmin.deps,
    })
    expect(withAdmin.saved[0].defaultProviderId).toBe('arena-default')
    // an org server on the allowlist is org-hosted
    const org = await AiProviderService.addProvider({
      user: userWith({}),
      input: { type: 'openai-compatible', model: 'llama', baseUrl: 'https://llm.example.org/v1' },
      deps: withAdmin.deps,
    })
    expect(org.provider).toMatchObject({ hostingClass: 'orgHosted', hasApiKey: false, name: 'OpenAI-compatible' })
  })

  test('a failed test sends an error key only, never what the provider or the network said', async () => {
    const secret = 'internal host db.corp.local refused the connection'
    const failing = createDeps({ runTest: async () => ({ ok: false, latencyMs: 1, errorKey: 'aiProviderAuth' }) })
    const error: any = await expectSystemErrorKey(
      AiProviderService.addProvider({
        user: userWith({}),
        input: { type: 'openai', model: 'm', apiKey: 'sk' },
        deps: failing.deps,
      }),
      'aiProviderAuth'
    )
    expect(failing.saved).toEqual([])
    // a result without a key is "unavailable", whatever else it carries
    const keyless = createDeps({ runTest: async () => ({ ok: false, latencyMs: 1, errorMessage: secret }) as any })
    const unavailable: any = await expectSystemErrorKey(
      AiProviderService.addProvider({
        user: userWith({}),
        input: { type: 'openai', model: 'm', apiKey: 'sk' },
        deps: keyless.deps,
      }),
      'aiProviderUnavailable'
    )
    expect(JSON.stringify([error.params, unavailable.params, unavailable.message])).not.toContain('db.corp.local')
  })

  test('a failed test or a missing secret saves nothing', async () => {
    const failing = createDeps({ runTest: async () => ({ ok: false, latencyMs: 1, errorKey: 'aiProviderAuth' }) })
    await expectSystemErrorKey(
      AiProviderService.addProvider({
        user: userWith({}),
        input: { type: 'openai', model: 'm', apiKey: 'bad' },
        deps: failing.deps,
      }),
      'aiProviderAuth'
    )
    expect(failing.saved).toEqual([])
    const noSecret = createDeps({ isEncryptionConfigured: () => false })
    const error: any = await expectSystemErrorKey(
      AiProviderService.addProvider({
        user: userWith({}),
        input: { type: 'openai', model: 'm', apiKey: 'sk' },
        deps: noSecret.deps,
      }),
      'aiEncryptionMissing'
    )
    expect(error.statusCode).toBe(409)
    expect(noSecret.tests).toEqual([])
    // a keyless provider needs no secret
    await AiProviderService.addProvider({
      user: userWith({}),
      input: { type: 'openai-compatible', model: 'llama', baseUrl: 'https://llm.example.org/v1' },
      deps: noSecret.deps,
    })
    expect(noSecret.saved).toHaveLength(1)
  })

  test('edit: a name change saves without a test, an omitted key is kept, an empty key clears it', async () => {
    const user = userWithProviders()
    const { deps, tests, saved } = createDeps({}, user)
    await AiProviderService.updateProvider({ user, id: 'acct:own', input: { name: 'Renamed' }, deps })
    expect(tests).toEqual([])
    expect(saved[0].providers[0]).toMatchObject({
      name: 'Renamed',
      apiKeyEncrypted: savedOpenAi.apiKeyEncrypted,
      lastTestOk: true,
    })
    await AiProviderService.updateProvider({ user, id: 'acct:own', input: { model: 'gpt-y' }, deps })
    expect(tests[0]).toEqual({ provider: 'openai', model: 'gpt-y', baseUrl: null, apiKey: 'sk-saved' })
    expect(saved[1].providers[0]).toMatchObject({
      model: 'gpt-y',
      apiKeyEncrypted: savedOpenAi.apiKeyEncrypted,
      lastTestAt: NOW,
    })
    await AiProviderService.updateProvider({ user, id: 'acct:org', input: { apiKey: '' }, deps })
    expect(saved[2].providers[1].apiKeyEncrypted).toBeNull()
    // the type of a saved provider never changes
    await AiProviderService.updateProvider({ user, id: 'acct:own', input: { type: 'anthropic', name: 'X' }, deps })
    expect(saved[3].providers[0].type).toBe('openai')
  })

  test('remove resets a removed default; the default can be any own, local or Arena id', async () => {
    const user = userWithProviders()
    const { deps, saved, store } = createDeps({}, user)
    await AiProviderService.removeProvider({ user, id: 'acct:own', deps })
    expect(saved[0]).toMatchObject({ defaultProviderId: 'arena-default', defaultProviderOrigin: 'user' })
    expect(saved[0].providers.map((provider: any) => provider.id)).toEqual(['acct:org'])
    store.set(user.prefs.ai)
    await AiProviderService.removeProvider({ user, id: 'acct:org', deps })
    expect(saved[1].defaultProviderId).toBe('acct:own')
    const local = await AiProviderService.setDefaultProvider({ user, providerId: 'local:abc', deps })
    expect(local.applied).toBe(true)
    expect(saved[2]).toMatchObject({ defaultProviderId: 'local:abc', defaultProviderOrigin: 'user' })
    await AiProviderService.setDefaultProvider({ user, providerId: 'arena-default', deps })
    expect(saved[3].defaultProviderId).toBe('arena-default')
  })

  test('the conversion call sets the default only while the origin is still converted', async () => {
    const chosen = userWithProviders()
    const { deps, saved, store } = createDeps({}, chosen)
    const skipped = await AiProviderService.setDefaultProvider({
      user: chosen,
      providerId: 'local:legacy',
      origin: 'converted',
      deps,
    })
    expect(skipped.applied).toBe(false)
    expect(saved).toEqual([])
    const oldSlot = userWith({ provider: 'openai', model: 'gpt-x', enabled: true, apiKeyEncrypted: 'enc:k' })
    store.set(oldSlot.prefs.ai)
    const converted = await AiProviderService.setDefaultProvider({
      user: oldSlot,
      providerId: 'local:legacy',
      origin: 'converted',
      deps,
    })
    expect(converted.applied).toBe(true)
    expect(saved[0]).toMatchObject({
      defaultProviderId: 'local:legacy',
      defaultProviderOrigin: 'converted',
      providers: [expect.objectContaining({ id: 'acct:legacy', apiKeyEncrypted: 'enc:k' })],
    })
    expect(saved[0]).not.toHaveProperty('provider')
  })

  test('a test stamps only a saved provider tested with its saved values', async () => {
    const user = userWithProviders()
    const { deps, saved } = createDeps(
      { runTest: async () => ({ ok: false, latencyMs: 1, errorKey: 'aiProviderAuth' }) },
      user
    )
    await AiProviderService.testProvider({ user, input: { id: 'acct:own' }, deps })
    expect(saved[0].providers[0]).toMatchObject({ lastTestOk: false, lastTestAt: NOW })
    await AiProviderService.testProvider({ user, input: { id: 'acct:own', model: 'other' }, deps })
    await AiProviderService.testProvider({ user, input: { type: 'openai', model: 'gpt-x', apiKey: 'sk' }, deps })
    expect(saved).toHaveLength(1)
  })

  test('the mock type exists only on test servers', async () => {
    const off = createDeps()
    await expectSystemErrorKey(
      AiProviderService.testProvider({ user: userWith({}), input: { type: 'mock', model: 'mock' }, deps: off.deps }),
      'aiProviderInvalid'
    )
    const on = createDeps({ isMockEnabled: () => true })
    expect(
      await AiProviderService.listProviderModels({ user: userWith({}), input: { type: 'mock' }, deps: on.deps })
    ).toEqual({ models: [{ id: 'mock' }] })
    expect(on.listed).toEqual([])
  })

  test('an unreadable saved key fails and is flagged, never replaced', async () => {
    const { deps, tests } = createDeps()
    const user = userWithProviders({ providers: [{ ...savedOpenAi, apiKeyEncrypted: 'v1:rotated' }] })
    const error: any = await expectSystemErrorKey(
      AiProviderService.testProvider({ user, input: { id: 'acct:own' }, deps }),
      'aiApiKeyUnreadable'
    )
    expect(error.statusCode).toBe(409)
    expect(tests).toEqual([])
    expect(AiProviderService.getPublicProviders(user, deps)[0]).toMatchObject({
      hasApiKey: true,
      apiKeyReadable: false,
    })
  })

  test('a rename never reads the key, so an unreadable key does not block it', async () => {
    const user = userWithProviders({ providers: [{ ...savedOpenAi, apiKeyEncrypted: 'v1:rotated' }] })
    const { deps, tests, saved } = createDeps({}, user)
    const { provider } = await AiProviderService.updateProvider({
      user,
      id: 'acct:own',
      input: { name: 'Renamed' },
      deps,
    })
    expect(provider).toMatchObject({ name: 'Renamed', hasApiKey: true, apiKeyReadable: false })
    expect(tests).toEqual([])
    expect(saved[0].providers[0]).toMatchObject({ name: 'Renamed', apiKeyEncrypted: 'v1:rotated' })
    // a change that needs the key still fails
    await expectSystemErrorKey(
      AiProviderService.updateProvider({ user, id: 'acct:own', input: { model: 'gpt-y' }, deps }),
      'aiApiKeyUnreadable'
    )
  })

  test('a null or blank key is "not sent": the stored key is used and kept', async () => {
    const user = userWithProviders()
    const { deps, tests, saved, listed } = createDeps({}, user)
    await AiProviderService.testProvider({ user, input: { id: 'acct:org', apiKey: null }, deps })
    await AiProviderService.testProvider({ user, input: { id: 'acct:org', apiKey: '   ' }, deps })
    expect(tests.map((cfg) => cfg.apiKey)).toEqual(['sk-org', 'sk-org'])
    await AiProviderService.updateProvider({ user, id: 'acct:org', input: { model: 'llama-2', apiKey: null }, deps })
    expect(tests[2].apiKey).toBe('sk-org')
    expect(saved.at(-1).providers[1].apiKeyEncrypted).toBe(savedCompatible.apiKeyEncrypted)
    // a changed endpoint never gets the stored key, for model lists either
    await AiProviderService.listProviderModels({
      user,
      input: { id: 'acct:org', baseUrl: 'https://evil.example.com/v1' },
      deps,
    })
    expect(listed).toEqual([
      { provider: 'openai-compatible', model: 'llama', baseUrl: 'https://evil.example.com/v1', apiKey: null },
    ])
    await AiProviderService.listProviderModels({ user, input: { id: 'acct:org' }, deps })
    expect(listed[1].apiKey).toBe('sk-org')
  })

  test('the new error keys exist in every language', () => {
    const keys = [
      'aiProviderNotFound',
      'aiProviderNotGateway',
      'aiApiKeyUnreadable',
      'aiEncryptionMissing',
      'aiProviderChanged',
    ]
    const errorsByLang = namespaceByLanguage('appErrors')
    for (const lang of LANGUAGES) {
      for (const key of keys) {
        expect([lang, key, typeof errorsByLang[lang][key]]).toEqual([lang, key, 'string'])
      }
    }
    for (const lang of CYRILLIC_LANGUAGES) {
      for (const key of keys) expect(errorsByLang[lang][key]).toMatch(CYRILLIC)
    }
  })
})
