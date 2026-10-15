import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserApi from '@server/modules/user/api/userApi'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import { readAiPrefs, writeAiPrefs } from '@server/modules/user/repository/userAiPrefsRepository'

import { getContextUser } from '@test/integration/config/context'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'
import { createSurveyMember, deleteUsers } from '@test/utils/routePermissionTestUtils'
import * as SB from '@test/utils/surveyBuilder'
import { collectRoutes } from '@test/utils/routeUtils'

const VICTIM_CIPHERTEXT = 'v2:victim-ciphertext'
const victimAi = {
  accessLevel: 2,
  defaultProviderId: 'acct:victim',
  defaultProviderOrigin: 'user',
  providers: [
    {
      id: 'acct:victim',
      type: 'openai-compatible',
      name: 'Mine',
      model: 'm',
      baseUrl: 'https://llm.example.org/v1',
      apiKeyEncrypted: VICTIM_CIPHERTEXT,
    },
  ],
}
const victimUsage = { day: '2026-10-15', calls: 7, chars: 1234 }

const expectNoServerOnlyPrefs = (value: any) => {
  const text = JSON.stringify(value)
  expect(text).not.toContain(VICTIM_CIPHERTEXT)
  expect(text).not.toContain('apiKeyEncrypted')
  expect(text).not.toContain('"aiUsage"')
  expect(text).not.toContain('"ai"')
}

describe('Server-only user prefs (054)', () => {
  let admin: any
  let victim: any
  let attacker: any
  let surveyId: number

  const readPrefs = async (userUuid: string): Promise<any> =>
    db.one('SELECT prefs FROM "user" WHERE uuid = $1', [userUuid], (row: any) => row.prefs)

  beforeAll(async () => {
    admin = getContextUser()
    const survey = await SB.survey(admin, SB.entity('root', SB.attribute('root_key').key())).buildAndStore()
    surveyId = Survey.getId(survey)
    victim = await createSurveyMember({ admin, surveyId, groupName: AuthGroup.groupNames.surveyEditor })
    attacker = await createSurveyMember({ admin, surveyId, groupName: AuthGroup.groupNames.surveyEditor })
    await writeAiPrefs({ userUuid: User.getUuid(victim), aiPrefs: victimAi })
    await db.none(`UPDATE "user" SET prefs = jsonb_set(prefs, '{aiUsage}', $2::jsonb, true) WHERE uuid = $1`, [
      User.getUuid(victim),
      JSON.stringify(victimUsage),
    ])
  })

  afterAll(async () => {
    await deleteUsers([victim, attacker])
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  test('the AI prefs are stored, and only the AI prefs reader returns them', async () => {
    expect(await readAiPrefs({ userUuid: User.getUuid(victim) })).toEqual(victimAi)
    expect((await readPrefs(User.getUuid(victim))).aiUsage).toEqual(victimUsage)
  })

  test('no user read selects prefs.ai or prefs.aiUsage', async () => {
    const victimUuid = User.getUuid(victim)
    const reads = [
      await UserManager.fetchUserByUuid(victimUuid),
      await UserManager.fetchUserByEmail(User.getEmail(victim)),
      await UserManager.fetchUserByUuidWithPassword(victimUuid),
      await UserRepository.fetchUserAndPasswordByEmail(User.getEmail(victim)),
      await UserManager.fetchUsers({ offset: 0, limit: 1000, sortBy: 'email', sortOrder: 'ASC' }),
      await UserManager.fetchUsersBySurveyId({ surveyId }),
    ]
    for (const read of reads) expectNoServerOnlyPrefs(read)
    // the non-AI prefs are still there
    expect((await UserManager.fetchUserByUuid(victimUuid)).prefs).toBeDefined()
  })

  test('a survey member listing the users of the survey cannot see the AI prefs of another member', async () => {
    const route = collectRoutes(UserApi.init).find(({ path }) => path === '/survey/:surveyId/users')
    const handler = route?.handlers.at(-1)
    const res = createFakeResponse()
    const next = jest.fn()
    await handler({ params: { surveyId: String(surveyId) }, query: {}, user: attacker }, res, next)
    expect(next).not.toHaveBeenCalled()
    const uuids = res.body.list.map((listed: any) => User.getUuid(listed))
    expect(uuids).toContain(User.getUuid(victim))
    expectNoServerOnlyPrefs(res.body)
  })

  test('the user returned by a prefs update has no server-only prefs', async () => {
    const updated = await UserManager.updateUserPrefs({ uuid: User.getUuid(victim), prefs: { language: 'fr' } })
    expectNoServerOnlyPrefs(updated)
    expect(updated.prefs.language).toBe('fr')
  })

  test('the generic prefs update ignores ai and aiUsage and keeps the stored ones', async () => {
    const forged = {
      language: 'es',
      ai: { providers: [{ id: 'acct:x', type: 'openai-compatible', apiKeyEncrypted: VICTIM_CIPHERTEXT }] },
      aiUsage: { day: '2026-10-15', calls: 0, chars: 0 },
    }
    await UserManager.updateUserPrefs({ uuid: User.getUuid(victim), prefs: forged })
    expect(await readAiPrefs({ userUuid: User.getUuid(victim) })).toEqual(victimAi)
    const stored = await readPrefs(User.getUuid(victim))
    expect(stored.aiUsage).toEqual(victimUsage)
    expect(stored.language).toBe('es')
  })

  test('a user cannot write their own prefs.ai through POST /user/:userUuid/prefs', async () => {
    const attackerUuid = User.getUuid(attacker)
    const route = collectRoutes(UserApi.init).find(
      ({ method, path }) => method === 'post' && path === '/user/:userUuid/prefs'
    )
    const handler = route?.handlers.at(-1)
    const body = {
      ...attacker,
      prefs: { language: 'fr', ai: { providers: [{ id: 'acct:x', apiKeyEncrypted: VICTIM_CIPHERTEXT }] }, aiUsage: {} },
    }
    const res = createFakeResponse()
    const next = jest.fn()
    await handler({ params: { userUuid: attackerUuid }, user: attacker, body }, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(await readAiPrefs({ userUuid: attackerUuid })).toBeNull()
    const stored = await readPrefs(attackerUuid)
    expect(stored.language).toBe('fr')
    expect(stored).not.toHaveProperty('ai')
    expect(stored).not.toHaveProperty('aiUsage')
  })

  test('a stale browser copy of the prefs cannot bring a removed key back', async () => {
    const victimUuid = User.getUuid(victim)
    const stale = { language: 'pt', ai: victimAi }
    // the key is removed by the AI writer ...
    await writeAiPrefs({ userUuid: victimUuid, aiPrefs: { ...victimAi, providers: [] } })
    // ... then the browser posts the prefs it loaded before (for example on a language change)
    await UserManager.updateUserPrefs({ uuid: victimUuid, prefs: stale })
    expect((await readAiPrefs({ userUuid: victimUuid }))?.providers).toEqual([])
    expect((await readPrefs(victimUuid)).language).toBe('pt')
  })

  test('a prefs update without prefs does not erase the stored ones', async () => {
    const victimUuid = User.getUuid(victim)
    await UserManager.updateUserPrefs({ uuid: victimUuid })
    expect((await readPrefs(victimUuid)).language).toBe('pt')
    expect((await readPrefs(victimUuid)).aiUsage).toEqual(victimUsage)
  })
})
