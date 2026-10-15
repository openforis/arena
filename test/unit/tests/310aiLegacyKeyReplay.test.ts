import { ENV } from '@core/processUtils'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import * as ProviderResolver from '@server/modules/ai/service/providerResolver'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { createAiPrefsStore } from '@test/unit/utils/aiPrefsStoreTestUtils'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { legacyEnvelope } from '@test/unit/utils/secretBoxTestUtils'

const SECRET = 'a'.repeat(64)
const ORG_ENDPOINT = 'https://llm.corp.example/v1'
const ATTACKER_ENDPOINT = 'https://attacker.example/v1'

/**
 * Builds a stored account provider.
 * @param {object} fields - Fields to override.
 * @returns {object} The provider.
 */
const storedProvider = (fields: Record<string, unknown>): any => ({
  id: 'acct:legacy',
  type: 'openai-compatible',
  name: 'P',
  model: 'm',
  baseUrl: ATTACKER_ENDPOINT,
  apiKeyEncrypted: null,
  lastTestOk: null,
  lastTestAt: null,
  ...fields,
})

const userWith = (provider: any): any => ({
  uuid: 'attacker',
  prefs: {
    ai: { accessLevel: 1, defaultProviderId: provider.id, defaultProviderOrigin: 'user', providers: [provider] },
  },
})

/**
 * Builds dependencies over an in-memory store.
 * @param {any} user - The user whose AI prefs are stored at the start.
 * @param {object} [options] - Options.
 * @param {string[]} [options.allowlist] - Org-hosted base URLs.
 * @param {string[]} [options.copied] - Envelopes also stored in the record of another user.
 * @returns {object} The dependencies, the tests they ran and the store.
 */
const createDeps = (user: any, { allowlist = [], copied = [] }: { allowlist?: string[]; copied?: string[] } = {}) => {
  const store = createAiPrefsStore(user.prefs.ai, copied)
  const tests: any[] = []
  const deps: AiProviderService.AiProviderServiceDeps = {
    updateAiPrefs: store.updateAiPrefs,
    runTest: async ({ cfg }) => {
      tests.push(cfg)
      return { ok: true, latencyMs: 1 }
    },
    listModels: async () => [],
    encrypt: SecretBox.encrypt,
    decrypt: SecretBox.decrypt,
    isLegacyEnvelope: SecretBox.isLegacyEnvelope,
    isEncryptionConfigured: () => true,
    hasAdminDefault: () => true,
    isMockEnabled: () => false,
    newId: () => 'new-id',
    now: () => '2026-10-16T00:00:00.000Z',
    allowlist,
    findCopiedEnvelopes: store.findCopiedEnvelopes,
  }
  return { deps, tests, store }
}

describe('Keys saved without an AAD cannot be replayed (310)', () => {
  let originalSecret: string | undefined
  let originalAllowlist: string[]

  beforeAll(() => {
    originalSecret = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    originalAllowlist = ENV.aiOrgHostedBaseUrls
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = SECRET
  })

  afterEach(() => {
    ENV.aiOrgHostedBaseUrls = originalAllowlist
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalSecret
  })

  describe('on an endpoint the user chooses', () => {
    const copiedKey = () => storedProvider({ apiKeyEncrypted: legacyEnvelope('sk-victim') })

    test('the key is never decrypted, so it is never sent', async () => {
      const user = userWith(copiedKey())
      const { deps, tests } = createDeps(user)
      const calls = [
        () => AiProviderService.testProvider({ user, input: { id: 'acct:legacy' }, deps }),
        () => AiProviderService.listProviderModels({ user, input: { id: 'acct:legacy' }, deps }),
        () => ProviderResolver.resolveProviderConfig({ user, providerId: 'acct:legacy', adminConfig: null }),
      ]
      for (const call of calls) {
        const error: any = await expectSystemErrorKey(call, 'aiApiKeyUnreadable')
        expect(error.statusCode).toBe(409)
      }
      expect(tests).toEqual([])
      expect(AiProviderService.getPublicProviders(user, deps)[0]).toMatchObject({
        hasApiKey: true,
        apiKeyReadable: false,
      })
    })

    test('it is not encrypted again for its holder, on the settings read or on any other write', async () => {
      const user = userWith(copiedKey())
      const { deps, store } = createDeps(user)
      expect(await AiProviderService.upgradeLegacyProviderKeys({ user, deps })).toBe(user)
      await AiProviderService.updateProvider({ user, id: 'acct:legacy', input: { name: 'Renamed' }, deps })
      expect(store.get()?.providers[0].apiKeyEncrypted).toBe(user.prefs.ai.providers[0].apiKeyEncrypted)
      expect(store.get()?.providers[0].name).toBe('Renamed')
    })

    test('the owner types the key again and it works', async () => {
      const user = userWith(copiedKey())
      const { deps, tests, store } = createDeps(user)
      await AiProviderService.updateProvider({ user, id: 'acct:legacy', input: { apiKey: 'sk-new' }, deps })
      expect(SecretBox.isLegacyEnvelope(store.get()?.providers[0].apiKeyEncrypted)).toBe(false)
      expect(tests[0].apiKey).toBe('sk-new')
    })
  })

  describe('where the server fixes the endpoint', () => {
    test('a key of a provider with a fixed endpoint still works and is encrypted again', async () => {
      const user = userWith(
        storedProvider({ type: 'openai', baseUrl: null, apiKeyEncrypted: legacyEnvelope('sk-own') })
      )
      const { deps, tests, store } = createDeps(user)
      await AiProviderService.testProvider({ user, input: { id: 'acct:legacy' }, deps })
      expect(tests[0].apiKey).toBe('sk-own')
      await AiProviderService.upgradeLegacyProviderKeys({ user, deps })
      expect(SecretBox.isLegacyEnvelope(store.get()?.providers[0].apiKeyEncrypted)).toBe(false)
    })

    test('a key on an allowlisted org server still works and is encrypted again', async () => {
      const user = userWith(storedProvider({ baseUrl: ORG_ENDPOINT, apiKeyEncrypted: legacyEnvelope('sk-own') }))
      const { deps, tests, store } = createDeps(user, { allowlist: [ORG_ENDPOINT] })
      await AiProviderService.testProvider({ user, input: { id: 'acct:legacy' }, deps })
      expect(tests[0].apiKey).toBe('sk-own')
      ENV.aiOrgHostedBaseUrls = [ORG_ENDPOINT]
      expect(
        ProviderResolver.resolveProviderConfig({ user, providerId: 'acct:legacy', adminConfig: null })
      ).toMatchObject({ cfg: { apiKey: 'sk-own' } })
      await AiProviderService.upgradeLegacyProviderKeys({ user, deps })
      const [upgraded] = store.get()?.providers ?? []
      expect(SecretBox.isLegacyEnvelope(upgraded.apiKeyEncrypted)).toBe(false)
    })

    test('an org server that is not on the allowlist (any more) does not get an old key', async () => {
      const user = userWith(storedProvider({ baseUrl: ORG_ENDPOINT, apiKeyEncrypted: legacyEnvelope('sk-own') }))
      const { deps } = createDeps(user, { allowlist: [] })
      await expectSystemErrorKey(
        AiProviderService.testProvider({ user, input: { id: 'acct:legacy' }, deps }),
        'aiApiKeyUnreadable'
      )
    })
  })

  describe('a key that is also stored in the record of another user', () => {
    test('it is removed, not encrypted again for its holder', async () => {
      const envelope = legacyEnvelope('sk-victim')
      const user = userWith(storedProvider({ type: 'openai', baseUrl: null, apiKeyEncrypted: envelope }))
      const { deps, store } = createDeps(user, { copied: [envelope] })
      const upgraded = await AiProviderService.upgradeLegacyProviderKeys({ user, deps })
      expect(store.get()?.providers[0].apiKeyEncrypted).toBeNull()
      expect(JSON.stringify(store.get())).not.toContain('v2:')
      expect(AiProviderService.getPublicProviders(upgraded, deps)[0].hasApiKey).toBe(false)
    })

    test('only the copied key is removed, the others are encrypted again', async () => {
      const copied = legacyEnvelope('sk-victim')
      const own = legacyEnvelope('sk-own')
      const user = userWith(storedProvider({ id: 'acct:a', type: 'openai', baseUrl: null, apiKeyEncrypted: copied }))
      user.prefs.ai.providers.push(
        storedProvider({ id: 'acct:b', type: 'anthropic', baseUrl: null, apiKeyEncrypted: own })
      )
      const { deps, store } = createDeps(user, { copied: [copied] })
      await AiProviderService.upgradeLegacyProviderKeys({ user, deps })
      const [first, second] = store.get()?.providers ?? []
      expect(first.apiKeyEncrypted).toBeNull()
      expect(SecretBox.isLegacyEnvelope(second.apiKeyEncrypted)).toBe(false)
      expect(second.apiKeyEncrypted).not.toBeNull()
    })
  })
})
