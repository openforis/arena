import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { db } from '@server/db/db'
import { buildKeyAad } from '@server/modules/ai/service/aiProviderPrefs'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import * as AiSettingsService from '@server/modules/ai/service/aiSettingsService'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserManager from '@server/modules/user/manager/userManager'
import {
  findEnvelopesOfOtherUsers,
  readAiPrefs,
  updateAiPrefs,
  writeAiPrefs,
} from '@server/modules/user/repository/userAiPrefsRepository'
import * as SecretBox from '@server/utils/crypto/secretBox'

import { getContextUser } from '@test/integration/config/context'
import { legacyEnvelope } from '@test/unit/utils/secretBoxTestUtils'
import { createSurveyMember, deleteUsers } from '@test/utils/routePermissionTestUtils'
import * as SB from '@test/utils/surveyBuilder'

const ENDPOINT = 'https://llm.example.org/v1'
const SECRET = 'a'.repeat(64)

/**
 * Creates a gate: `wait()` resolves once `open()` has been called.
 * @returns {{wait: Function, open: Function}} The gate.
 */
const createGate = () => {
  let open: () => void = () => undefined
  const promise = new Promise<void>((resolve) => {
    open = resolve
  })
  return { wait: () => promise, open }
}

/**
 * Builds a stored keyless provider.
 * @param {string} id - Provider id.
 * @returns {object} The provider.
 */
const keyless = (id: string) => ({
  id,
  type: 'openai-compatible',
  name: id,
  model: 'm',
  baseUrl: ENDPOINT,
  apiKeyEncrypted: null,
  lastTestOk: null,
  lastTestAt: null,
})

const idsOf = (aiPrefs: any): string[] => (aiPrefs?.providers ?? []).map((provider: any) => provider.id)

describe('AI prefs writer (055)', () => {
  let admin: any
  let member: any
  let other: any
  let surveyId: number
  let originalSecret: string | undefined

  const uuid = () => User.getUuid(member)

  /**
   * Loads the user as a request sees it: arena-server reads the whole row, the server-only prefs included.
   * @returns {Promise<any>} The user.
   */
  const loadRequestUser = async (): Promise<any> => {
    const user = await UserManager.fetchUserByUuid(uuid())
    return { ...user, prefs: { ...User.getPrefs(user), ai: await readAiPrefs({ userUuid: uuid() }) } }
  }

  const readPrefs = async (): Promise<any> =>
    db.one('SELECT prefs FROM "user" WHERE uuid = $1', [uuid()], (row: any) => row.prefs)

  const providerDeps = (runTest: AiProviderService.AiProviderServiceDeps['runTest']) => ({
    ...AiProviderService.createDefaultAiProviderServiceDeps(),
    runTest,
    hasAdminDefault: () => true,
    isEncryptionConfigured: () => true,
    allowlist: [],
  })

  beforeAll(async () => {
    originalSecret = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = SECRET
    admin = getContextUser()
    const survey = await SB.survey(admin, SB.entity('root', SB.attribute('root_key').key())).buildAndStore()
    surveyId = Survey.getId(survey)
    member = await createSurveyMember({ admin, surveyId, groupName: AuthGroup.groupNames.surveyEditor })
    other = await createSurveyMember({ admin, surveyId, groupName: AuthGroup.groupNames.surveyEditor })
  })

  beforeEach(async () => {
    await db.none(`UPDATE "user" SET prefs = COALESCE(prefs, '{}'::jsonb) - 'ai' - 'aiUsage' WHERE uuid = ANY($1::uuid[])`, [
      [uuid(), User.getUuid(other)],
    ])
  })

  afterAll(async () => {
    if (originalSecret === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalSecret
    await deleteUsers([member, other])
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  test('two concurrent updates both land: the second runs on what the first stored', async () => {
    await writeAiPrefs({ userUuid: uuid(), aiPrefs: { accessLevel: 1, providers: [] } })
    const add = (id: string) =>
      updateAiPrefs({
        userUuid: uuid(),
        update: async (current) => {
          // a slow change keeps the row locked: the other update must wait for it, not read what it read
          await new Promise((resolve) => setTimeout(resolve, 100))
          return { ...current, providers: [...(current?.providers ?? []), keyless(id)] }
        },
      })
    await Promise.all([add('acct:a'), add('acct:b')])
    expect(idsOf(await readAiPrefs({ userUuid: uuid() })).sort()).toEqual(['acct:a', 'acct:b'])
  })

  test('a failing or empty change writes nothing', async () => {
    const aiPrefs = { accessLevel: 2, providers: [keyless('acct:a')] }
    await writeAiPrefs({ userUuid: uuid(), aiPrefs })
    await expect(
      updateAiPrefs({
        userUuid: uuid(),
        update: async () => {
          throw new Error('refused')
        },
      })
    ).rejects.toThrow('refused')
    expect(await updateAiPrefs({ userUuid: uuid(), update: () => null })).toEqual(aiPrefs)
    expect(await readAiPrefs({ userUuid: uuid() })).toEqual(aiPrefs)
  })

  test('it never overwrites the other prefs, aiUsage included, even when they are written at the same time', async () => {
    const usage = { day: '2026-10-15', calls: 3, chars: 90 }
    await db.none(`UPDATE "user" SET prefs = jsonb_set(prefs, '{aiUsage}', $2::jsonb, true) WHERE uuid = $1`, [
      uuid(),
      JSON.stringify(usage),
    ])
    const gate = createGate()
    const writing = updateAiPrefs({
      userUuid: uuid(),
      update: async () => {
        await gate.wait()
        return { accessLevel: 3, providers: [keyless('acct:a')] }
      },
    })
    // another request writes its own key while the AI prefs are being changed: it waits for the row, then applies
    const usageWrite = db.none(
      `UPDATE "user" SET prefs = jsonb_set(prefs, '{aiUsage}', $2::jsonb, true) WHERE uuid = $1`,
      [uuid(), JSON.stringify({ ...usage, calls: 4 })]
    )
    const languageWrite = UserManager.updateUserPrefs({ uuid: uuid(), prefs: { language: 'fr' } })
    gate.open()
    await Promise.all([writing, usageWrite, languageWrite])
    const prefs = await readPrefs()
    expect(prefs.aiUsage).toEqual({ ...usage, calls: 4 })
    expect(prefs.language).toBe('fr')
    expect(prefs.ai).toMatchObject({ accessLevel: 3 })
  })

  test('two provider tests running at the same time save both providers', async () => {
    const gate = createGate()
    const deps = providerDeps(async () => {
      await gate.wait()
      return { ok: true, latencyMs: 1 }
    })
    const user = await loadRequestUser()
    const input = { type: 'openai-compatible', model: 'm', baseUrl: ENDPOINT }
    const adding = Promise.all([
      AiProviderService.addProvider({ user, input: { ...input, name: 'One' }, deps }),
      AiProviderService.addProvider({ user, input: { ...input, name: 'Two' }, deps }),
    ])
    gate.open()
    await adding
    const names = (await readAiPrefs({ userUuid: uuid() }))?.providers.map((provider: any) => provider.name).sort()
    expect(names).toEqual(['One', 'Two'])
  })

  test('a provider removed while another one is being tested stays removed', async () => {
    await writeAiPrefs({
      userUuid: uuid(),
      aiPrefs: {
        accessLevel: 2,
        defaultProviderId: 'arena-default',
        defaultProviderOrigin: 'user',
        providers: [keyless('acct:a'), keyless('acct:b')],
      },
    })
    const stale = await loadRequestUser()
    const gate = createGate()
    const deps = providerDeps(async () => {
      await gate.wait()
      return { ok: true, latencyMs: 1 }
    })
    const editing = AiProviderService.updateProvider({ user: stale, id: 'acct:a', input: { model: 'edited' }, deps })
    await AiProviderService.removeProvider({ user: stale, id: 'acct:b', deps })
    gate.open()
    await editing
    const stored = await readAiPrefs({ userUuid: uuid() })
    expect(idsOf(stored)).toEqual(['acct:a'])
    expect(stored?.providers[0]).toMatchObject({ model: 'edited', lastTestOk: true })
  })

  test('a settings save from a stale copy keeps the providers saved since', async () => {
    const stale = await loadRequestUser()
    const user = { ...stale, prefs: { ...stale.prefs, ai: null } }
    const deps = providerDeps(async () => ({ ok: true, latencyMs: 1 }))
    await AiProviderService.addProvider({
      user,
      input: { type: 'openai-compatible', model: 'm', baseUrl: ENDPOINT },
      deps,
    })
    const saved = await AiSettingsService.saveSettings({ user, update: { accessLevel: 2 } })
    expect((saved.prefs as any).ai.providers).toHaveLength(1)
    const stored = await readAiPrefs({ userUuid: uuid() })
    expect(stored?.providers).toHaveLength(1)
    expect(stored?.accessLevel).toBe(2)
  })

  test('a key saved without an AAD is encrypted again for its owner and provider when the settings are read', async () => {
    // a provider whose endpoint the server fixes: an old key is accepted there
    const old = { ...keyless('acct:old'), type: 'openai', baseUrl: null, apiKeyEncrypted: legacyEnvelope('sk-old') }
    await writeAiPrefs({ userUuid: uuid(), aiPrefs: { accessLevel: 1, providers: [old] } })
    await AiProviderService.upgradeLegacyProviderKeys({ user: await loadRequestUser() })
    const [stored] = (await readAiPrefs({ userUuid: uuid() }))?.providers
    expect(SecretBox.isLegacyEnvelope(stored.apiKeyEncrypted)).toBe(false)
    const aad = buildKeyAad({ userUuid: uuid(), provider: stored })
    expect(SecretBox.decrypt(stored.apiKeyEncrypted, aad)).toBe('sk-old')
    // copied to another user, it no longer decrypts
    expect(() =>
      SecretBox.decrypt(stored.apiKeyEncrypted, buildKeyAad({ userUuid: 'someone-else', provider: stored }))
    ).toThrow()
  })

  describe('a key saved without an AAD that is stored for another user too', () => {
    let copiedKey: string
    // made once the encryption secret is set (by the beforeAll of the suite)
    beforeAll(() => {
      copiedKey = legacyEnvelope('sk-victim')
    })
    const providerWith = (apiKeyEncrypted: string) => ({
      ...keyless('acct:old'),
      type: 'openai',
      baseUrl: null,
      apiKeyEncrypted,
    })

    test('the search finds the envelopes of the records of other users only', async () => {
      const unique = legacyEnvelope('sk-unique')
      await writeAiPrefs({ userUuid: User.getUuid(other), aiPrefs: { providers: [providerWith(copiedKey)] } })
      await writeAiPrefs({ userUuid: uuid(), aiPrefs: { providers: [providerWith(copiedKey), providerWith(unique)] } })
      expect(await findEnvelopesOfOtherUsers({ userUuid: uuid(), envelopes: [copiedKey, unique] })).toEqual([copiedKey])
      expect(await findEnvelopesOfOtherUsers({ userUuid: User.getUuid(other), envelopes: [unique] })).toEqual([unique])
      expect(await findEnvelopesOfOtherUsers({ userUuid: uuid(), envelopes: [] })).toEqual([])
      // text with wildcards is looked for as it is
      expect(await findEnvelopesOfOtherUsers({ userUuid: uuid(), envelopes: ['%', '_'] })).toEqual([])
    })

    test('it is removed on the upgrade, not encrypted again; the key that is not shared is encrypted again', async () => {
      const unique = legacyEnvelope('sk-unique')
      await writeAiPrefs({ userUuid: User.getUuid(other), aiPrefs: { providers: [providerWith(copiedKey)] } })
      await writeAiPrefs({
        userUuid: uuid(),
        aiPrefs: { accessLevel: 1, providers: [providerWith(copiedKey), { ...providerWith(unique), id: 'acct:own' }] },
      })
      await AiProviderService.upgradeLegacyProviderKeys({ user: await loadRequestUser() })
      const [shared, own] = (await readAiPrefs({ userUuid: uuid() }))?.providers
      expect(shared.apiKeyEncrypted).toBeNull()
      expect(SecretBox.isLegacyEnvelope(own.apiKeyEncrypted)).toBe(false)
      expect(SecretBox.decrypt(own.apiKeyEncrypted, buildKeyAad({ userUuid: uuid(), provider: own }))).toBe('sk-unique')
    })
  })
})
