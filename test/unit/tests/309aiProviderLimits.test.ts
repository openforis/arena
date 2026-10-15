import { AI_MAX_ACCOUNT_PROVIDERS, AI_PROVIDER_FIELD_MAX_CHARS } from '@common/ai/providerLimits'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { createAiPrefsStore } from '@test/unit/utils/aiPrefsStoreTestUtils'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const SECRET = 'f'.repeat(64)

/**
 * Builds a stored account provider.
 * @param {number} n - Number of the provider.
 * @returns {object} The provider (no key).
 */
const storedProvider = (n: number): any => ({
  id: `acct:p${n}`,
  type: 'openai-compatible',
  name: `P${n}`,
  model: 'm',
  baseUrl: 'https://llm.example.org/v1',
  apiKeyEncrypted: null,
  lastTestOk: null,
  lastTestAt: null,
})

/**
 * Builds the stored AI prefs with the number of providers.
 * @param {number} count - Number of providers.
 * @returns {object} The AI prefs.
 */
const aiPrefsWith = (count: number): any => ({
  accessLevel: 1,
  defaultProviderId: 'arena-default',
  defaultProviderOrigin: 'user',
  providers: Array.from({ length: count }, (_value, n) => storedProvider(n)),
})

/**
 * Builds recording dependencies over an in-memory store.
 * @param {object} aiPrefs - The AI prefs stored at the start.
 * @returns {object} The dependencies, the tests they ran and the store.
 */
const createDeps = (aiPrefs: any) => {
  const store = createAiPrefsStore(aiPrefs)
  const tests: any[] = []
  const deps: AiProviderService.AiProviderServiceDeps = {
    updateAiPrefs: store.updateAiPrefs,
    runTest: async ({ cfg }) => {
      tests.push(cfg)
      return { ok: true, latencyMs: 1 }
    },
    listModels: async () => [{ id: 'm1' }],
    encrypt: SecretBox.encrypt,
    decrypt: SecretBox.decrypt,
    isLegacyEnvelope: SecretBox.isLegacyEnvelope,
    isEncryptionConfigured: () => true,
    hasAdminDefault: () => true,
    isMockEnabled: () => false,
    newId: (() => {
      let n = 100
      return () => `new-${(n += 1)}`
    })(),
    now: () => '2026-10-15T00:00:00.000Z',
    allowlist: [],
  }
  return { deps, tests, store }
}

const userWith = (aiPrefs: any): any => ({ uuid: 'u1', prefs: { ai: aiPrefs } })
const newProvider = { type: 'openai-compatible', model: 'm', baseUrl: 'https://llm.example.org/v1', apiKey: 'sk-1' }

describe('Limits of the providers of an account (309)', () => {
  let originalSecret: string | undefined

  beforeAll(() => {
    originalSecret = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = SECRET
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalSecret
  })

  describe('the number of providers', () => {
    test('a user with the most providers cannot add another, and nothing is tested or saved', async () => {
      const prefs = aiPrefsWith(AI_MAX_ACCOUNT_PROVIDERS)
      const { deps, tests, store } = createDeps(prefs)
      const error: any = await expectSystemErrorKey(
        AiProviderService.addProvider({ user: userWith(prefs), input: newProvider, deps }),
        'aiProviderLimitReached'
      )
      expect(error.statusCode).toBe(409)
      expect(error.params).toEqual({ max: AI_MAX_ACCOUNT_PROVIDERS })
      expect(tests).toEqual([])
      expect(store.writes).toEqual([])
    })

    test('a user one under the limit can add one', async () => {
      const prefs = aiPrefsWith(AI_MAX_ACCOUNT_PROVIDERS - 1)
      const { deps, store } = createDeps(prefs)
      await AiProviderService.addProvider({ user: userWith(prefs), input: newProvider, deps })
      expect(store.get()?.providers).toHaveLength(AI_MAX_ACCOUNT_PROVIDERS)
    })

    test('two adds at once, one under the limit, save one: the limit is checked on the latest providers', async () => {
      const prefs = aiPrefsWith(AI_MAX_ACCOUNT_PROVIDERS - 1)
      const { deps, store } = createDeps(prefs)
      const results = await Promise.allSettled([
        AiProviderService.addProvider({ user: userWith(prefs), input: newProvider, deps }),
        AiProviderService.addProvider({ user: userWith(prefs), input: newProvider, deps }),
      ])
      expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected'])
      const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult
      expect(rejected.reason.key).toBe('aiProviderLimitReached')
      expect(store.get()?.providers).toHaveLength(AI_MAX_ACCOUNT_PROVIDERS)
    })

    test('a user over the limit can still edit and remove providers', async () => {
      const prefs = aiPrefsWith(AI_MAX_ACCOUNT_PROVIDERS + 2)
      const { deps, store } = createDeps(prefs)
      await AiProviderService.updateProvider({ user: userWith(prefs), id: 'acct:p1', input: { name: 'New' }, deps })
      await AiProviderService.removeProvider({ user: userWith(prefs), id: 'acct:p2', deps })
      expect(store.get()?.providers).toHaveLength(AI_MAX_ACCOUNT_PROVIDERS + 1)
    })
  })

  describe('the length of the values', () => {
    const tooLong = (field: keyof typeof AI_PROVIDER_FIELD_MAX_CHARS) =>
      'x'.repeat(AI_PROVIDER_FIELD_MAX_CHARS[field] + 1)

    test.each(['model', 'baseUrl', 'apiKey'] as const)(
      'the %s of a provider that is too long is refused by every route',
      async (field) => {
        const prefs = aiPrefsWith(1)
        const { deps, tests, store } = createDeps(prefs)
        const user = userWith(prefs)
        const input = { ...newProvider, [field]: tooLong(field) }
        const calls = [
          () => AiProviderService.testProvider({ user, input, deps }),
          () => AiProviderService.listProviderModels({ user, input, deps }),
          () => AiProviderService.addProvider({ user, input, deps }),
          () => AiProviderService.updateProvider({ user, id: 'acct:p0', input: { [field]: input[field] }, deps }),
        ]
        for (const call of calls) {
          const error: any = await expectSystemErrorKey(call, 'aiProviderFieldTooLong')
          expect(error.statusCode).toBe(400)
          expect(error.params).toEqual({ field, max: AI_PROVIDER_FIELD_MAX_CHARS[field] })
        }
        expect(tests).toEqual([])
        expect(store.writes).toEqual([])
      }
    )

    test('a value at the limit is accepted, and a long name is shortened as before', async () => {
      const { deps, store } = createDeps(aiPrefsWith(0))
      await AiProviderService.addProvider({
        user: userWith(aiPrefsWith(0)),
        input: {
          ...newProvider,
          model: 'm'.repeat(AI_PROVIDER_FIELD_MAX_CHARS.model),
          apiKey: 'k'.repeat(AI_PROVIDER_FIELD_MAX_CHARS.apiKey),
          name: 'n'.repeat(500),
        },
        deps,
      })
      const [stored] = store.get()?.providers ?? []
      expect(stored.model).toHaveLength(AI_PROVIDER_FIELD_MAX_CHARS.model)
      expect(stored.name.length).toBeLessThanOrEqual(60)
    })
  })
})
