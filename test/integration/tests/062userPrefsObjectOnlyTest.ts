import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserApi from '@server/modules/user/api/userApi'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import { createUserServiceWithPrefsUpdate } from '@server/modules/user/service/userServicePrefsOverride'
import { readAiPrefs, writeAiPrefs } from '@server/modules/user/repository/userAiPrefsRepository'

import { getContextUser } from '@test/integration/config/context'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'
import { createSurveyMember, deleteUsers } from '@test/utils/routePermissionTestUtils'
import * as SB from '@test/utils/surveyBuilder'
import { collectRoutes } from '@test/utils/routeUtils'

const ai = { accessLevel: 1, providers: [] }
const notObjects: unknown[] = [[1], [], 'x', 5, true]

describe('The prefs of a user stay an object (062)', () => {
  let member: any
  let surveyId: number

  const readPrefs = async (): Promise<any> =>
    db.one('SELECT prefs FROM "user" WHERE uuid = $1', [User.getUuid(member)], (row: any) => row.prefs)

  const expectPrefsIntact = async () => {
    const prefs = await readPrefs()
    expect(Array.isArray(prefs)).toBe(false)
    expect(prefs.language).toBe('fr')
    expect(await readAiPrefs({ userUuid: User.getUuid(member) })).toEqual(ai)
  }

  beforeAll(async () => {
    const admin = getContextUser()
    const survey = await SB.survey(admin, SB.entity('root', SB.attribute('root_key').key())).buildAndStore()
    surveyId = Survey.getId(survey)
    member = await createSurveyMember({ admin, surveyId, groupName: AuthGroup.groupNames.surveyEditor })
    await UserManager.updateUserPrefs({ uuid: User.getUuid(member), prefs: { language: 'fr' } })
    await writeAiPrefs({ userUuid: User.getUuid(member), aiPrefs: ai })
  })

  afterAll(async () => {
    await deleteUsers([member])
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  test.each(notObjects)(
    'POST /user/:userUuid/prefs refuses the prefs %j with 400, and nothing is stored',
    async (prefs) => {
      const route = collectRoutes(UserApi.init).find(
        ({ method, path }) => method === 'post' && path === '/user/:userUuid/prefs'
      )
      const next = jest.fn()
      await route?.handlers.at(-1)(
        { params: { userUuid: User.getUuid(member) }, user: member, body: { ...member, prefs } },
        createFakeResponse(),
        next
      )
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0][0]).toMatchObject({ key: 'userPrefsInvalid', statusCode: 400 })
      await expectPrefsIntact()
    }
  )

  test.each(notObjects)('the database does not apply the prefs %j either', async (prefs) => {
    const user = await UserRepository.updateUserPrefs({ uuid: User.getUuid(member), prefs } as any)
    // the update still answers with the user, whose prefs are the stored object
    expect(User.getUuid(user)).toBe(User.getUuid(member))
    expect(Array.isArray(User.getPrefs(user))).toBe(false)
    await expectPrefsIntact()
  })

  test('the user service of the login does not turn the prefs into an array', async () => {
    const service = createUserServiceWithPrefsUpdate(
      { updateUserPrefs: async (_options: { userToUpdate: unknown }) => ({}) },
      UserManager.updateUserPrefsAndFetchGroups
    )
    for (const prefs of notObjects) {
      const updated = await service.updateUserPrefs({ userToUpdate: { uuid: User.getUuid(member), prefs } })
      expect(User.getUuid(updated)).toBe(User.getUuid(member))
    }
    await expectPrefsIntact()
  })

  test('an object still merges, and the server-only keys are still stripped', async () => {
    await UserManager.updateUserPrefs({ uuid: User.getUuid(member), prefs: { theme: 'dark', ai: { providers: [1] } } })
    const prefs = await readPrefs()
    expect(prefs.theme).toBe('dark')
    expect(prefs.language).toBe('fr')
    expect(await readAiPrefs({ userUuid: User.getUuid(member) })).toEqual(ai)
  })
})
