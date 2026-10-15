import { buildKeyAad } from '@server/modules/ai/service/aiProviderPrefs'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import * as ProviderResolver from '@server/modules/ai/service/providerResolver'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { legacyEnvelope } from '@test/unit/utils/secretBoxTestUtils'

const SECRET = 'e'.repeat(64)
const ENDPOINT = 'https://llm.example.org/v1'
const ATTACKER_ENDPOINT = 'https://attacker.example/v1'
const adminConfig = null

/**
 * Encrypts a key for a provider of a user, as the service stores it.
 * @param {string} userUuid - The owner.
 * @param {object} provider - The provider (id, type, baseUrl).
 * @param {string} plain - The key.
 * @returns {string} The stored ciphertext.
 */
const sealedFor = (userUuid: string, provider: { id: string; type: string; baseUrl: string | null }, plain: string) =>
  SecretBox.encrypt(plain, buildKeyAad({ userUuid, provider }))

/**
 * Builds a stored account provider.
 * @param {object} fields - Fields to override.
 * @returns {object} The provider.
 */
const storedProvider = (fields: Record<string, unknown>): any => ({
  id: 'acct:p1',
  type: 'openai-compatible',
  name: 'P',
  model: 'm',
  baseUrl: ENDPOINT,
  apiKeyEncrypted: null,
  lastTestOk: null,
  lastTestAt: null,
  ...fields,
})

/**
 * Builds a user with the providers.
 * @param {string} uuid - User uuid.
 * @param {object[]} providers - Stored providers.
 * @returns {any} The user.
 */
const userWith = (uuid: string, providers: any[]): any => ({
  uuid,
  prefs: { ai: { accessLevel: 1, defaultProviderId: 'arena-default', defaultProviderOrigin: 'user', providers } },
})

/**
 * Builds recording dependencies with the real secret box.
 * @returns {object} The dependencies and what they recorded.
 */
const createDeps = () => {
  const tests: any[] = []
  const listed: any[] = []
  const deps: AiProviderService.AiProviderServiceDeps = {
    savePrefs: async (user, aiPrefs) => ({ ...user, prefs: { ...user.prefs, ai: aiPrefs } }) as any,
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
    newId: () => 'new-id',
    now: () => '2026-10-15T00:00:00.000Z',
    allowlist: [],
  }
  return { deps, tests, listed }
}

describe('Provider keys are bound to their owner (302)', () => {
  let originalSecret: string | undefined

  beforeAll(() => {
    originalSecret = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = SECRET
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalSecret
  })

  test("a ciphertext copied into another user's provider is never decrypted, so the key is never sent", async () => {
    const victimProvider = storedProvider({ id: 'acct:victim', baseUrl: ATTACKER_ENDPOINT })
    // the ciphertext of the victim, for the victim's provider
    const stolen = sealedFor('victim', { ...victimProvider, baseUrl: ATTACKER_ENDPOINT }, 'sk-victim')
    // the attacker saves it in their own provider that points at their own server
    const attacker = userWith('attacker', [
      storedProvider({ id: 'acct:x', baseUrl: ATTACKER_ENDPOINT, apiKeyEncrypted: stolen }),
    ])
    const { deps, tests, listed } = createDeps()
    const calls = [
      () => AiProviderService.testProvider({ user: attacker, input: { id: 'acct:x' }, deps }),
      () => AiProviderService.listProviderModels({ user: attacker, input: { id: 'acct:x' }, deps }),
      () => AiProviderService.updateProvider({ user: attacker, id: 'acct:x', input: { model: 'other' }, deps }),
      () => ProviderResolver.resolveProviderConfig({ user: attacker, providerId: 'acct:x', adminConfig }),
    ]
    for (const call of calls) {
      const error: any = await expectSystemErrorKey(call, 'aiApiKeyUnreadable')
      expect(error.statusCode).toBe(409)
    }
    expect(tests).toEqual([])
    expect(listed).toEqual([])
    // the settings panel flags the key as unreadable
    expect(AiProviderService.getPublicProviders(attacker, deps)[0]).toMatchObject({
      hasApiKey: true,
      apiKeyReadable: false,
    })
  })

  test('the same ciphertext does not work for another provider id, type or endpoint of the same user', async () => {
    const original = { id: 'acct:p1', type: 'openai-compatible', baseUrl: ENDPOINT }
    const ciphertext = sealedFor('u1', original, 'sk-own')
    const { deps, tests } = createDeps()
    const moved = [
      storedProvider({ id: 'acct:p2', apiKeyEncrypted: ciphertext }),
      storedProvider({ id: 'acct:p1', baseUrl: ATTACKER_ENDPOINT, apiKeyEncrypted: ciphertext }),
      storedProvider({ id: 'acct:p1', type: 'openai', baseUrl: null, apiKeyEncrypted: ciphertext }),
    ]
    for (const provider of moved) {
      await expectSystemErrorKey(
        AiProviderService.testProvider({ user: userWith('u1', [provider]), input: { id: provider.id }, deps }),
        'aiApiKeyUnreadable'
      )
    }
    expect(tests).toEqual([])
    // in place it works, with a trailing slash on the endpoint ignored
    const inPlace = storedProvider({ apiKeyEncrypted: ciphertext })
    await AiProviderService.testProvider({ user: userWith('u1', [inPlace]), input: { id: 'acct:p1' }, deps })
    await AiProviderService.testProvider({
      user: userWith('u1', [{ ...inPlace, baseUrl: `${ENDPOINT}/` }]),
      input: { id: 'acct:p1' },
      deps,
    })
    expect(tests.map((cfg) => cfg.apiKey)).toEqual(['sk-own', 'sk-own'])
  })

  test('a saved key is encrypted for its user, provider id, type and endpoint', async () => {
    const { deps } = createDeps()
    const saved: any[] = []
    deps.savePrefs = async (user, aiPrefs) => {
      saved.push(aiPrefs)
      return { ...user, prefs: { ...user.prefs, ai: aiPrefs } } as any
    }
    const { provider } = await AiProviderService.addProvider({
      user: userWith('u1', []),
      input: { type: 'openai-compatible', model: 'm', baseUrl: ENDPOINT, apiKey: 'sk-new' },
      deps,
    })
    const [stored] = saved[0].providers
    expect(provider.id).toBe('acct:new-id')
    const aad = buildKeyAad({
      userUuid: 'u1',
      provider: { id: 'acct:new-id', type: 'openai-compatible', baseUrl: ENDPOINT },
    })
    expect(SecretBox.decrypt(stored.apiKeyEncrypted, aad)).toBe('sk-new')
    expect(() => SecretBox.decrypt(stored.apiKeyEncrypted, buildKeyAad({ userUuid: 'u2', provider: stored }))).toThrow()
    // a typed key on an edit is bound to the endpoint it is saved with
    const edited = await AiProviderService.updateProvider({
      user: userWith('u1', [stored]),
      id: 'acct:new-id',
      input: { baseUrl: ATTACKER_ENDPOINT, apiKey: 'sk-moved' },
      deps,
    })
    const [moved] = saved[1].providers
    expect(edited.provider.baseUrl).toBe(ATTACKER_ENDPOINT)
    expect(SecretBox.decrypt(moved.apiKeyEncrypted, buildKeyAad({ userUuid: 'u1', provider: moved }))).toBe('sk-moved')
    expect(() => SecretBox.decrypt(moved.apiKeyEncrypted, aad)).toThrow()
  })

  test('a client cannot send a ciphertext: apiKeyEncrypted in a request is ignored', async () => {
    const { deps, tests } = createDeps()
    const saved: any[] = []
    deps.savePrefs = async (user, aiPrefs) => {
      saved.push(aiPrefs)
      return { ...user, prefs: { ...user.prefs, ai: aiPrefs } } as any
    }
    const forged = sealedFor('victim', { id: 'acct:p1', type: 'openai', baseUrl: null }, 'sk-victim')
    // a draft with a forged ciphertext has no key
    await expectSystemErrorKey(
      AiProviderService.addProvider({
        user: userWith('u1', []),
        input: { type: 'openai', model: 'gpt', apiKeyEncrypted: forged } as any,
        deps,
      }),
      'aiApiKeyMissing'
    )
    // a keyless provider stores no key at all
    await AiProviderService.addProvider({
      user: userWith('u1', []),
      input: { type: 'openai-compatible', model: 'm', baseUrl: ENDPOINT, apiKeyEncrypted: forged } as any,
      deps,
    })
    expect(saved[0].providers[0].apiKeyEncrypted).toBeNull()
    expect(tests[0].apiKey).toBeNull()
    // an edit keeps the stored ciphertext and ignores the sent one
    const own = storedProvider({
      apiKeyEncrypted: sealedFor('u1', { id: 'acct:p1', type: 'openai-compatible', baseUrl: ENDPOINT }, 'sk-own'),
    })
    await AiProviderService.updateProvider({
      user: userWith('u1', [own]),
      id: 'acct:p1',
      input: { name: 'Renamed', apiKeyEncrypted: forged } as any,
      deps,
    })
    expect(saved[1].providers[0].apiKeyEncrypted).toBe(own.apiKeyEncrypted)
  })

  test('a key saved before the AAD existed still works for its owner', async () => {
    const legacy = storedProvider({ apiKeyEncrypted: legacyEnvelope('sk-old') })
    const { deps, tests } = createDeps()
    await AiProviderService.testProvider({ user: userWith('u1', [legacy]), input: { id: 'acct:p1' }, deps })
    expect(tests[0].apiKey).toBe('sk-old')
    expect(
      ProviderResolver.resolveProviderConfig({ user: userWith('u1', [legacy]), providerId: 'acct:p1', adminConfig })
    ).toMatchObject({ cfg: { apiKey: 'sk-old' } })
    expect(AiProviderService.getPublicProviders(userWith('u1', [legacy]), deps)[0].apiKeyReadable).toBe(true)
  })
})
