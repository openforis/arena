import { buildKeyAad } from '@server/modules/ai/service/aiProviderPrefs'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import * as AiSettingsService from '@server/modules/ai/service/aiSettingsService'
import { changeAiPrefs } from '@server/modules/ai/service/aiPrefsWriter'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { createAiPrefsStore } from '@test/unit/utils/aiPrefsStoreTestUtils'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { legacyEnvelope } from '@test/unit/utils/secretBoxTestUtils'

const SECRET = 'f'.repeat(64)
const USER_UUID = 'u1'
const ENDPOINT = 'https://llm.example.org/v1'

/**
 * Builds a stored provider that needs no key.
 * @param {string} id - Provider id.
 * @param {object} [fields] - Fields to override.
 * @returns {object} The provider.
 */
const keyless = (id: string, fields: Record<string, unknown> = {}): any => ({
  id,
  type: 'openai-compatible',
  name: id,
  model: 'm',
  baseUrl: ENDPOINT,
  apiKeyEncrypted: null,
  lastTestOk: null,
  lastTestAt: null,
  ...fields,
})

/**
 * Builds a user holding the providers, the first one the default.
 * @param {object[]} providers - Stored providers.
 * @returns {any} The user (the copy loaded when a request begins).
 */
const userWith = (providers: any[]): any => ({
  uuid: USER_UUID,
  prefs: {
    ai: {
      accessLevel: 2,
      defaultProviderId: providers[0]?.id ?? 'arena-default',
      defaultProviderOrigin: 'user',
      providers,
    },
  },
})

/**
 * Builds dependencies over an in-memory store, with a test that runs `whileTesting` (another request) first.
 * @param {any} user - The user whose AI prefs are stored at the start.
 * @param {Function} [whileTesting] - Runs while a provider test is in flight.
 * @returns {object} The dependencies and the store.
 */
const createDeps = (user: any, whileTesting: () => Promise<unknown> = async () => undefined) => {
  const store = createAiPrefsStore(user.prefs.ai)
  const deps: AiProviderService.AiProviderServiceDeps = {
    updateAiPrefs: store.updateAiPrefs,
    runTest: async () => {
      await whileTesting()
      return { ok: true, latencyMs: 1 }
    },
    listModels: async () => [],
    encrypt: SecretBox.encrypt,
    decrypt: SecretBox.decrypt,
    isLegacyEnvelope: SecretBox.isLegacyEnvelope,
    isEncryptionConfigured: () => true,
    hasAdminDefault: () => true,
    isMockEnabled: () => false,
    newId: (() => {
      let count = 0
      return () => `new-${++count}`
    })(),
    now: () => '2026-10-15T00:00:00.000Z',
    allowlist: [],
    findCopiedEnvelopes: store.findCopiedEnvelopes,
  }
  return { deps, store }
}

/**
 * Returns the ids of the providers in the AI prefs.
 * @param {object|null} aiPrefs - Stored AI prefs.
 * @returns {string[]} The ids, in stored order.
 */
const idsOf = (aiPrefs: any): string[] => (aiPrefs?.providers ?? []).map((provider: any) => provider.id)

describe('AI prefs are changed on their latest stored value (303)', () => {
  let originalSecret: string | undefined

  beforeAll(() => {
    originalSecret = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = SECRET
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalSecret
  })

  test('a stale snapshot cannot undo a delete made while a provider test was running', async () => {
    const snapshot = userWith([keyless('acct:a'), keyless('acct:b')])
    let removeB: () => Promise<unknown> = async () => undefined
    const { deps, store } = createDeps(snapshot, () => removeB())
    // another request removes B while the edit of A waits for its test
    removeB = () => AiProviderService.removeProvider({ user: snapshot, id: 'acct:b', deps })
    await AiProviderService.updateProvider({ user: snapshot, id: 'acct:a', input: { model: 'changed' }, deps })
    expect(idsOf(store.get())).toEqual(['acct:a'])
    expect(store.get()?.providers[0]).toMatchObject({ model: 'changed', lastTestOk: true })
  })

  test('a test result does not bring back a provider removed while it ran, and is not stamped on a removed one', async () => {
    const snapshot = userWith([keyless('acct:a'), keyless('acct:b')])
    let remove = 'acct:b'
    const { deps, store } = createDeps(snapshot, () =>
      AiProviderService.removeProvider({ user: snapshot, id: remove, deps })
    )
    await AiProviderService.testProvider({ user: snapshot, input: { id: 'acct:a' }, deps })
    expect(idsOf(store.get())).toEqual(['acct:a'])
    expect(store.get()?.providers[0].lastTestOk).toBe(true)
    // the tested provider itself is removed: the result is returned and nothing is written
    store.set(snapshot.prefs.ai)
    remove = 'acct:a'
    const writes = store.writes.length
    const result = await AiProviderService.testProvider({ user: snapshot, input: { id: 'acct:a' }, deps })
    expect(result.ok).toBe(true)
    expect(idsOf(store.get())).toEqual(['acct:b'])
    expect(store.writes).toHaveLength(writes + 1)
  })

  test('a result is not stamped on a provider edited while the test ran', async () => {
    const snapshot = userWith([keyless('acct:a')])
    const { deps, store } = createDeps(snapshot)
    const edited = keyless('acct:a', { model: 'edited elsewhere' })
    deps.runTest = async () => {
      store.set({ ...snapshot.prefs.ai, providers: [edited] })
      return { ok: true, latencyMs: 1 }
    }
    await AiProviderService.testProvider({ user: snapshot, input: { id: 'acct:a' }, deps })
    expect(store.get()?.providers[0]).toMatchObject({ model: 'edited elsewhere', lastTestOk: null })
    expect(store.writes).toEqual([])
  })

  test('an edit of a provider removed while its test ran is a 404; of one changed meanwhile, a 409', async () => {
    const snapshot = userWith([keyless('acct:a')])
    const removed = createDeps(snapshot, async () => {
      store.set({ ...snapshot.prefs.ai, providers: [] })
    })
    const store = removed.store
    const notFound: any = await expectSystemErrorKey(
      AiProviderService.updateProvider({ user: snapshot, id: 'acct:a', input: { model: 'x' }, deps: removed.deps }),
      'aiProviderNotFound'
    )
    expect(notFound.statusCode).toBe(404)
    expect(store.writes).toEqual([])
    const changed = createDeps(snapshot, async () => {
      changedStore.set({
        ...snapshot.prefs.ai,
        providers: [keyless('acct:a', { baseUrl: 'https://other.example.org/v1' })],
      })
    })
    const changedStore = changed.store
    const conflict: any = await expectSystemErrorKey(
      AiProviderService.updateProvider({ user: snapshot, id: 'acct:a', input: { model: 'x' }, deps: changed.deps }),
      'aiProviderChanged'
    )
    expect(conflict.statusCode).toBe(409)
    expect(changedStore.writes).toEqual([])
    // a name change is applied to what is stored, with no test
    const renamed = createDeps(snapshot)
    renamed.store.set({ ...snapshot.prefs.ai, providers: [keyless('acct:a', { model: 'other' })] })
    await AiProviderService.updateProvider({
      user: snapshot,
      id: 'acct:a',
      input: { name: 'New name' },
      deps: renamed.deps,
    })
    expect(renamed.store.get()?.providers[0]).toMatchObject({ name: 'New name', model: 'other' })
  })

  test('two adds from the same stale copy both land, and only the first can take the default', async () => {
    const snapshot = { uuid: USER_UUID, prefs: { ai: { accessLevel: 1 } } }
    const { deps, store } = createDeps(snapshot)
    deps.hasAdminDefault = () => false
    const input = { type: 'openai-compatible', model: 'm', baseUrl: ENDPOINT }
    await Promise.all([
      AiProviderService.addProvider({ user: snapshot as any, input, deps }),
      AiProviderService.addProvider({ user: snapshot as any, input, deps }),
    ])
    expect(idsOf(store.get())).toEqual(['acct:new-1', 'acct:new-2'])
    expect(store.get()?.defaultProviderId).toBe('acct:new-1')
    expect(store.get()?.accessLevel).toBe(1)
  })

  test('a default cannot be set to a provider removed meanwhile, and a settings save keeps the providers', async () => {
    const snapshot = userWith([keyless('acct:a'), keyless('acct:b')])
    const { deps, store } = createDeps(snapshot)
    await AiProviderService.removeProvider({ user: snapshot, id: 'acct:b', deps })
    await expectSystemErrorKey(
      AiProviderService.setDefaultProvider({ user: snapshot, providerId: 'acct:b', deps }),
      'aiProviderNotFound'
    )
    // the settings panel saves from the copy it loaded, which still has B
    const saved = await AiSettingsService.saveSettings({
      user: snapshot,
      update: { accessLevel: 3 },
      deps: {
        updateAiPrefs: store.updateAiPrefs,
        cipher: cipherOf(),
        isEncryptionConfigured: () => true,
        allowlist: [],
        findCopiedEnvelopes: store.findCopiedEnvelopes,
      },
    })
    expect(idsOf(store.get())).toEqual(['acct:a'])
    expect(store.get()?.accessLevel).toBe(3)
    expect(idsOf((saved.prefs as any).ai)).toEqual(['acct:a'])
  })

  describe('keys saved without an AAD', () => {
    const legacyProvider = () =>
      keyless('acct:old', { type: 'openai', baseUrl: null, apiKeyEncrypted: legacyEnvelope('sk-old') })
    const aadOf = (provider: any) => buildKeyAad({ userUuid: USER_UUID, provider })

    test('every write encrypts them again for their owner and provider', async () => {
      const snapshot = userWith([legacyProvider(), keyless('acct:b')])
      const { deps, store } = createDeps(snapshot)
      await AiProviderService.removeProvider({ user: snapshot, id: 'acct:b', deps })
      const [stored] = store.get()?.providers
      expect(SecretBox.isLegacyEnvelope(stored.apiKeyEncrypted)).toBe(false)
      expect(SecretBox.decrypt(stored.apiKeyEncrypted, aadOf(stored))).toBe('sk-old')
      expect(() => SecretBox.decrypt(stored.apiKeyEncrypted, aadOf({ ...stored, id: 'acct:other' }))).toThrow()
    })

    test('an unreadable old key is left as it is, and nothing is encrypted again without the server secret', async () => {
      const broken = keyless('acct:old', { apiKeyEncrypted: 'v1:not-a-real-envelope' })
      const one = createDeps(userWith([broken, keyless('acct:b')]))
      await AiProviderService.removeProvider({
        user: userWith([broken, keyless('acct:b')]),
        id: 'acct:b',
        deps: one.deps,
      })
      expect(one.store.get()?.providers[0].apiKeyEncrypted).toBe('v1:not-a-real-envelope')
      const snapshot = userWith([legacyProvider(), keyless('acct:b')])
      const two = createDeps(snapshot)
      two.deps.isEncryptionConfigured = () => false
      await AiProviderService.removeProvider({ user: snapshot, id: 'acct:b', deps: two.deps })
      expect(SecretBox.isLegacyEnvelope(two.store.get()?.providers[0].apiKeyEncrypted)).toBe(true)
    })

    test('reading the settings upgrades them once, best effort', async () => {
      const snapshot = userWith([legacyProvider()])
      const { deps, store } = createDeps(snapshot)
      const upgraded = await AiProviderService.upgradeLegacyProviderKeys({ user: snapshot, deps })
      expect(SecretBox.isLegacyEnvelope(store.get()?.providers[0].apiKeyEncrypted)).toBe(false)
      expect(store.writes).toHaveLength(1)
      expect(SecretBox.isLegacyEnvelope((upgraded.prefs as any).ai.providers[0].apiKeyEncrypted)).toBe(false)
      // nothing left to do: no write
      expect(await AiProviderService.upgradeLegacyProviderKeys({ user: upgraded, deps })).toBe(upgraded)
      expect(store.writes).toHaveLength(1)
      // a database failure does not fail the read
      const failing = createDeps(snapshot)
      failing.deps.updateAiPrefs = async () => {
        throw new Error('db down')
      }
      expect(await AiProviderService.upgradeLegacyProviderKeys({ user: snapshot, deps: failing.deps })).toBe(snapshot)
    })
  })

  test('changeAiPrefs writes nothing when the change returns null and there is nothing to upgrade', async () => {
    const snapshot = userWith([keyless('acct:a')])
    const store = createAiPrefsStore(snapshot.prefs.ai)
    const user = await changeAiPrefs({
      user: snapshot,
      change: () => null,
      deps: {
        updateAiPrefs: store.updateAiPrefs,
        cipher: cipherOf(),
        isEncryptionConfigured: () => true,
        allowlist: [],
        findCopiedEnvelopes: store.findCopiedEnvelopes,
      },
    })
    expect(store.writes).toEqual([])
    expect((user.prefs as any).ai).toBe(snapshot.prefs.ai)
  })
})

/**
 * Returns the real secret box as the writer uses it.
 * @returns {object} The cipher.
 */
function cipherOf() {
  return { encrypt: SecretBox.encrypt, decrypt: SecretBox.decrypt, isLegacy: SecretBox.isLegacyEnvelope }
}
