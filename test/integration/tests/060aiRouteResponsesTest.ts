import { ENV } from '@core/processUtils'
import { AiFeatureCategory } from '@common/ai/features'
import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'

import * as AiApi from '@server/modules/ai/api/aiApi'
import { getSurveyAiPolicy } from '@server/modules/ai/service/surveyAiPolicyService'
import * as SurveyApi from '@server/modules/survey/api/surveyApi'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '@test/integration/config/context'
import { collectRoutes, CollectedRoute } from '@test/utils/routeUtils'
import * as SB from '@test/utils/surveyBuilder'
import {
  createMembersOfAllGroups,
  deleteMembersOfAllGroups,
  outsiderKey,
  runRouteChain,
} from '@test/utils/routePermissionTestUtils'

const { groupNames } = AuthGroup

// the settings and provider routes: they answer a user who is logged in, and only while AI is on
const settingsRoutes: [string, string][] = [
  ['get', '/ai/settings'],
  ['put', '/ai/settings'],
  ['put', '/ai/settings/default'],
  ['post', '/ai/providers/test'],
  ['post', '/ai/providers/models'],
  ['post', '/ai/providers'],
  ['put', '/ai/providers/:id'],
  ['delete', '/ai/providers/:id'],
]

const aiOn = {
  accessLevel: 3,
  featuresEnabled: true,
  featureToggles: Object.fromEntries(Object.values(AiFeatureCategory).map((category) => [category, true])),
}

describe('AI routes: what the real handler chains answer (060)', () => {
  let admin: any
  let surveyId: number
  let members: Record<string, any>
  let aiRoutes: CollectedRoute[]
  let surveyRoutes: CollectedRoute[]
  const originalAiEnabled = ENV.aiFeaturesEnabled

  const find = (routes: CollectedRoute[], method: string, path: string) => {
    const found = routes.find((route) => route.method === method && route.path === path)
    expect(found).toBeDefined()
    return found
  }
  // the user as a request sees it: the AI prefs are server-only, so they are put on the user here
  const withAi = (user: any) => ({ ...user, prefs: { ...user.prefs, ai: aiOn } })
  const params = () => ({ surveyId: String(surveyId) })
  // the permission middlewares answer with the error as JSON text, the error handler of the server with an object
  const errorOf = (res: any) => (typeof res.body === 'string' ? JSON.parse(res.body) : res.body)

  beforeAll(async () => {
    admin = getContextUser()
    const survey = await SB.survey(admin, SB.entity('root', SB.attribute('root_key').key())).buildAndStore()
    surveyId = Survey.getId(survey)
    members = await createMembersOfAllGroups({ admin, surveyId })
    aiRoutes = collectRoutes(AiApi.init)
    surveyRoutes = collectRoutes(SurveyApi.init)
  })

  beforeEach(() => {
    ENV.aiFeaturesEnabled = true
  })

  afterAll(async () => {
    ENV.aiFeaturesEnabled = originalAiEnabled
    if (members) await deleteMembersOfAllGroups(members)
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  describe('PUT /survey/:surveyId/ai-policy', () => {
    const put = (user: any, body: object) =>
      runRouteChain({ route: find(aiRoutes, 'put', '/survey/:surveyId/ai-policy'), user, params: params(), body })

    test('a survey editor is refused with 403 and the policy stays as it was', async () => {
      const before = await getSurveyAiPolicy(surveyId)
      const res = await put(members[groupNames.surveyEditor], { schema: 'off', data: 'off' })
      expect(res.statusCode).toBe(403)
      expect(errorOf(res)).toMatchObject({ key: expect.stringContaining('userNotAuthorized') })
      expect((await getSurveyAiPolicy(surveyId)).policy).toEqual(before.policy)
    })

    test('a survey administrator saves it, and the answer is the new state', async () => {
      const res = await put(members[groupNames.surveyAdmin], { schema: 'onDevice', data: 'off' })
      expect(res.statusCode).toBe(200)
      expect(res.body).toMatchObject({ policy: { schema: 'onDevice', data: 'off' }, canEdit: true })
      expect((await getSurveyAiPolicy(surveyId)).policy).toEqual({ schema: 'onDevice', data: 'off' })
    })

    test('a system administrator saves it, also while AI is switched off on the server', async () => {
      ENV.aiFeaturesEnabled = false
      const res = await put(admin, { schema: 'orgHosted', data: 'onDevice' })
      expect(res.statusCode).toBe(200)
      expect((await getSurveyAiPolicy(surveyId)).policy).toEqual({ schema: 'orgHosted', data: 'onDevice' })
    })

    test('record data more permissive than the design is a 400 for an administrator, and nothing is saved', async () => {
      const before = await getSurveyAiPolicy(surveyId)
      const res = await put(members[groupNames.surveyAdmin], { schema: 'onDevice', data: 'cloud' })
      expect(res.statusCode).toBe(400)
      expect(res.body.key).toBe('aiPolicyDataAboveSchema')
      expect((await getSurveyAiPolicy(surveyId)).policy).toEqual(before.policy)
    })
  })

  describe('GET /survey/:surveyId/schema-summary/ai-items', () => {
    const get = (user: any) =>
      runRouteChain({
        route: find(surveyRoutes, 'get', '/survey/:surveyId/schema-summary/ai-items'),
        user,
        params: params(),
      })

    test('a user who is not a member of the survey gets 403 and no item', async () => {
      const res = await get(withAi(members[outsiderKey]))
      expect(res.statusCode).toBe(403)
      expect(errorOf(res)).toMatchObject({ key: expect.stringContaining('userNotAuthorized') })
    })

    test('a member whose AI is off gets the error key, not the items', async () => {
      const res = await get(members[groupNames.dataEditor])
      expect(res.statusCode).toBe(403)
      expect(res.body.key).toBe('aiFeaturesDisabled')
    })

    test('AI switched off on the server is 404 for a member', async () => {
      ENV.aiFeaturesEnabled = false
      const res = await get(withAi(members[groupNames.dataEditor]))
      expect(res.statusCode).toBe(404)
      expect(res.body.key).toBe('aiFeaturesDisabled')
    })

    test('a member whose AI is on gets the items', async () => {
      const res = await get(withAi(members[groupNames.dataEditor]))
      expect(res.statusCode).toBe(200)
    })
  })

  describe('settings and provider routes', () => {
    test('the matrix covers every settings route of the module', () => {
      const registered = aiRoutes
        .filter(({ path }) => path.startsWith('/ai/settings') || path.startsWith('/ai/providers'))
        .map(({ method, path }) => `${method} ${path}`)
      expect(registered.sort()).toEqual(settingsRoutes.map(([method, path]) => `${method} ${path}`).sort())
    })

    test.each(settingsRoutes)('%s %s: not logged in is 401, with AI on and with AI off', async (method, path) => {
      const route = find(aiRoutes, method, path)
      for (const aiEnabled of [true, false]) {
        ENV.aiFeaturesEnabled = aiEnabled
        const res = await runRouteChain({ route, params: { id: 'acct:x' } })
        expect(res.statusCode).toBe(401)
      }
    })

    test.each(settingsRoutes)(
      '%s %s: AI switched off on the server is 404 for a logged in user',
      async (method, path) => {
        ENV.aiFeaturesEnabled = false
        const res = await runRouteChain({
          route: find(aiRoutes, method, path),
          user: withAi(members[groupNames.surveyEditor]),
          params: { id: 'acct:x' },
          body: { baseUrl: 'http://127.0.0.1:1/v1', apiKey: 'sk-must-not-be-used' },
        })
        expect(res.statusCode).toBe(404)
        expect(res.body.key).toBe('aiFeaturesDisabled')
      }
    )

    test('GET /ai/settings answers a logged in user with the settings, and no key', async () => {
      const res = await runRouteChain({
        route: find(aiRoutes, 'get', '/ai/settings'),
        user: withAi(members[groupNames.surveyEditor]),
      })
      expect(res.statusCode).toBe(200)
      expect(res.body.providers).toEqual([])
      expect(JSON.stringify(res.body)).not.toContain('apiKeyEncrypted')
    })
  })

  describe('POST /ai/model', () => {
    const post = (user: any, body: object) => runRouteChain({ route: find(aiRoutes, 'post', '/ai/model'), user, body })
    const callBody = (override: object = {}) => ({
      surveyId,
      feature: 'expressionGenerate',
      dataClass: 'schema',
      stream: false,
      call: { prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] },
      ...override,
    })
    const editor = () => withAi(members[groupNames.surveyEditor])

    test('not logged in: 401 for a login-only feature, 403 for a feature of a survey', async () => {
      expect((await post(undefined, callBody({ feature: 'chatbot', surveyId: undefined }))).statusCode).toBe(401)
      expect((await post(undefined, callBody())).statusCode).toBe(403)
    })

    test('AI switched off on the server is 404, before any permission is checked', async () => {
      ENV.aiFeaturesEnabled = false
      const res = await post(editor(), callBody())
      expect(res.statusCode).toBe(404)
      expect(res.body.key).toBe('aiFeaturesDisabled')
    })

    test('a user without the permission of the feature is 403 (the survey comes from the body)', async () => {
      const cases: [string, string][] = [
        [outsiderKey, 'translation'],
        [groupNames.dataEditor, 'translation'],
        [groupNames.dataEditor, 'assistantCleaning'],
      ]
      for (const [member, feature] of cases) {
        const res = await post(withAi(members[member]), callBody({ feature }))
        expect([member, feature, res.statusCode]).toEqual([member, feature, 403])
        expect(errorOf(res)).toMatchObject({ key: expect.stringContaining('userNotAuthorized') })
      }
    })

    test('a data class the feature does not allow is 400 aiCallInvalid (dataClass)', async () => {
      const res = await post(editor(), callBody({ dataClass: 'data' }))
      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({ key: 'aiCallInvalid', params: { reason: 'dataClass' } })
    })

    test('a data class that does not exist, or none, is 400 aiCallInvalid (dataClass)', async () => {
      for (const dataClass of ['everything', undefined, 7]) {
        const res = await post(editor(), callBody({ dataClass }))
        expect(res.statusCode).toBe(400)
        expect(res.body).toMatchObject({ key: 'aiCallInvalid', params: { reason: 'dataClass' } })
      }
    })

    test('a survey feature without a surveyId (or with null) is 400 aiCallInvalid (surveyId), whoever asks', async () => {
      for (const user of [editor(), withAi(admin), undefined]) {
        for (const missing of [undefined, null]) {
          const res = await post(user, callBody({ surveyId: missing }))
          expect(res.statusCode).toBe(400)
          expect(res.body).toMatchObject({ key: 'aiCallInvalid', params: { reason: 'surveyId' } })
        }
      }
    })

    test('a login-only feature with a surveyId is 400 aiCallInvalid (surveyId): its policy cannot be probed', async () => {
      const res = await post(editor(), callBody({ feature: 'chatbot', dataClass: 'schema' }))
      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({ key: 'aiCallInvalid', params: { reason: 'surveyId' } })
    })
  })
})
