import { removeCopiedLegacyKeys } from '@server/modules/ai/service/aiPrefsWriter'
import { getProviderPrefs } from '@server/modules/ai/service/aiProviderPrefs'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { legacyEnvelope } from '@test/unit/utils/secretBoxTestUtils'

const SECRET = 'c'.repeat(64)

const provider = (id: string, apiKeyEncrypted: string | null): any => ({
  id,
  type: 'openai',
  name: 'P',
  model: 'gpt-x',
  baseUrl: null,
  apiKeyEncrypted,
  lastTestOk: null,
  lastTestAt: null,
})

const listPrefs = (...providers: any[]) => ({ accessLevel: 1, defaultProviderId: 'arena-default', providers })

/**
 * Builds the dependencies over an in-memory table of AI prefs by user.
 * @param {object} table - AI prefs by user uuid (changed in place by the writes).
 * @returns {object} The dependencies and the users written.
 */
const createDeps = (table: Record<string, any>) => {
  const written: string[] = []
  return {
    written,
    deps: {
      readAllAiPrefs: async () => Object.entries(table).map(([userUuid, aiPrefs]) => ({ userUuid, aiPrefs })),
      updateAiPrefs: async (userUuid: string, update: any) => {
        const next = await update(table[userUuid], {})
        if (!next) return table[userUuid]
        written.push(userUuid)
        table[userUuid] = next
        return next
      },
      getKeyId: SecretBox.getLegacyEnvelopeId,
    },
  }
}

const keysOf = (aiPrefs: any) => getProviderPrefs(aiPrefs).providers.map(({ apiKeyEncrypted }) => apiKeyEncrypted)

describe('old AI keys copied between users (314)', () => {
  let originalSecret: string | undefined

  beforeAll(() => {
    originalSecret = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = SECRET
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalSecret
  })

  test('a copied old key is removed from every record that holds it, the other keys stay', async () => {
    const copied = legacyEnvelope('sk-victim')
    const own = legacyEnvelope('sk-own')
    const bound = SecretBox.encrypt('sk-new', 'aad')
    const table: Record<string, any> = {
      victim: listPrefs(provider('acct:a', copied), provider('acct:b', bound)),
      // the old single slot is read too
      copier: { provider: 'openai', model: 'gpt-x', apiKeyEncrypted: copied, enabled: true },
      other: listPrefs(provider('acct:c', own)),
    }
    const { deps, written } = createDeps(table)
    expect(await removeCopiedLegacyKeys(deps)).toBe(2)
    expect(written.sort((a, b) => a.localeCompare(b))).toEqual(['copier', 'victim'])
    expect(keysOf(table.victim)).toEqual([null, bound])
    expect(keysOf(table.copier)).toEqual([null])
    expect(keysOf(table.other)).toEqual([own])
    // nothing left: a second run writes nothing
    expect(await removeCopiedLegacyKeys(deps)).toBe(0)
    expect(written).toHaveLength(2)
  })

  test('another spelling of the same envelope (whitespace, URL alphabet, no padding) is still a copy', async () => {
    const copied = legacyEnvelope('sk-victim')
    const payload = copied.slice('v1:'.length)
    const respelled = `v1:${payload.slice(0, 8)}\n${payload.slice(8).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}`
    expect(SecretBox.decrypt(respelled, 'any', { allowLegacy: true })).toBe('sk-victim')
    const table: Record<string, any> = {
      victim: listPrefs(provider('acct:a', copied)),
      copier: listPrefs(provider('acct:x', respelled)),
    }
    const { deps } = createDeps(table)
    expect(await removeCopiedLegacyKeys(deps)).toBe(2)
    expect(keysOf(table.victim)).toEqual([null])
    expect(keysOf(table.copier)).toEqual([null])
  })

  test('an old key held twice by the same user, or a new key held by two users, is not a copy', async () => {
    const own = legacyEnvelope('sk-own')
    const bound = SecretBox.encrypt('sk', 'aad')
    const table: Record<string, any> = {
      one: listPrefs(provider('acct:a', own), provider('acct:b', own)),
      two: listPrefs(provider('acct:c', bound)),
      three: listPrefs(provider('acct:d', bound)),
    }
    const { deps, written } = createDeps(table)
    expect(await removeCopiedLegacyKeys(deps)).toBe(0)
    expect(written).toEqual([])
  })
})
