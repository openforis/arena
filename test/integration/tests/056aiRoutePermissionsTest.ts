import { AiFeatures } from '@common/ai/features'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'

import * as AiApi from '@server/modules/ai/api/aiApi'
import * as SurveyApi from '@server/modules/survey/api/surveyApi'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '@test/integration/config/context'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'
import { CollectedRoute, collectRoutes } from '@test/utils/routeUtils'
import * as SB from '@test/utils/surveyBuilder'
import {
  accessGrantedTo,
  checkRouteAccess,
  createMembersOfAllGroups,
  deleteMembersOfAllGroups,
  getAccessByUser,
  outsiderKey,
  systemAdminKey,
} from '@test/utils/routePermissionTestUtils'

type Route = CollectedRoute

const { groupNames } = AuthGroup

// who passes each permission, by group: view and record list = any member; edit = survey editors and above;
// cleanse = data cleansers, analysts, survey editors and above (data editors cannot)
const viewers = [
  groupNames.surveyAdmin,
  groupNames.surveyEditor,
  groupNames.dataEditor,
  groupNames.dataCleanser,
  groupNames.dataAnalyst,
  systemAdminKey,
]
const editors = [groupNames.surveyAdmin, groupNames.surveyEditor, systemAdminKey]
const cleansers = [
  groupNames.surveyAdmin,
  groupNames.surveyEditor,
  groupNames.dataCleanser,
  groupNames.dataAnalyst,
  systemAdminKey,
]
const surveyAdmins = [groupNames.surveyAdmin, systemAdminKey]

// who passes the permission of each gateway feature (the mapping itself is locked by the unit test 074)
// (the features themselves come from the registry: a new gateway feature fails here until it has its row)
const allowedByFeature: Record<string, string[]> = {
  expressionGenerate: editors,
  expressionExplain: editors,
  translation: editors,
  dataQueryGenerate: viewers,
  dataQuerySummarize: viewers,
  activityLogSummary: viewers,
  dataDictionary: viewers,
  assistantDesign: editors,
  assistantAnalysis: viewers,
  assistantCleaning: cleansers,
  // login only: also a user who belongs to no survey
  chatbot: [...viewers, outsiderKey],
}

// the features the browser may call through POST /ai/model
const gatewayFeatureKeys: string[] = Object.values(AiFeatures)
  .filter(({ gateway }) => gateway)
  .map(({ key }) => key)

describe('AI routes: permissions with real users (056)', () => {
  let admin: any
  let surveyId: number
  let members: Record<string, any>
  let aiRoutes: Route[]
  const route = (method: string, path: string) => {
    const found = aiRoutes.find((candidate) => candidate.method === method && candidate.path === path)
    expect(found).toBeDefined()
    return found
  }

  beforeAll(async () => {
    admin = getContextUser()
    const survey = await SB.survey(admin, SB.entity('root', SB.attribute('root_key').key())).buildAndStore()
    surveyId = Survey.getId(survey)
    members = await createMembersOfAllGroups({ admin, surveyId })
    aiRoutes = collectRoutes(AiApi.init)
  })

  afterAll(async () => {
    if (members) await deleteMembersOfAllGroups(members)
    await SurveyManager.deleteSurvey(surveyId, {})
  })

  const accessOf = (params: { route: Route | undefined; body?: object; handlerIndex?: number }) =>
    getAccessByUser({ members, surveyId, ...params })

  test('GET /survey/:surveyId/ai-policy: any member of the survey, nobody else', async () => {
    const access = await accessOf({ route: route('get', '/survey/:surveyId/ai-policy') })
    expect(access).toEqual(accessGrantedTo(members, viewers))
  })

  test('PUT /survey/:surveyId/ai-policy: survey administrators and system admins only', async () => {
    const access = await accessOf({ route: route('put', '/survey/:surveyId/ai-policy') })
    expect(access).toEqual(accessGrantedTo(members, surveyAdmins))
  })

  test('GET /survey/:surveyId/schema-summary/ai-items: any member of the survey, nobody else', async () => {
    const surveyRoute = collectRoutes(SurveyApi.init).find(
      ({ method, path }) => method === 'get' && path === '/survey/:surveyId/schema-summary/ai-items'
    )
    expect(await accessOf({ route: surveyRoute })).toEqual(accessGrantedTo(members, viewers))
  })

  describe('POST /ai/model: the permission of the requested feature', () => {
    // handler 0 is the AI switch, handler 1 the permission of the feature (the survey comes from the body)
    const modelRoute = () => route('post', '/ai/model')

    test('the matrix covers every gateway feature of the registry, and only those', () => {
      expect(Object.keys(allowedByFeature).sort()).toEqual([...gatewayFeatureKeys].sort())
    })

    test.each(gatewayFeatureKeys)('%s', async (feature) => {
      expect(allowedByFeature[feature]).toBeDefined()
      const access = await accessOf({ route: modelRoute(), body: { feature, surveyId }, handlerIndex: 1 })
      expect(access).toEqual(accessGrantedTo(members, allowedByFeature[feature]))
    })

    test('the survey is taken from the body, which wins over the route params', async () => {
      const access = await checkRouteAccess({
        route: modelRoute(),
        user: members[groupNames.surveyEditor],
        surveyId: 0,
        body: { feature: 'translation', surveyId },
        handlerIndex: 1,
      })
      expect(access).toBe('granted')
    })

    test('chatbot needs a logged in user only: no user gets 401', async () => {
      const access = await checkRouteAccess({
        route: modelRoute(),
        user: undefined,
        surveyId,
        body: { feature: 'chatbot' },
        handlerIndex: 1,
      })
      expect(access).toBe('refused')
    })

    test('an unknown feature is a 400 before any permission is checked', async () => {
      const res = createFakeResponse()
      let nextCalled = false
      await modelRoute().handlers[1]({ params: {}, query: {}, body: { feature: 'nope' }, user: admin }, res, () => {
        nextCalled = true
      })
      expect(nextCalled).toBe(false)
      expect(res.statusCode).toBe(400)
      expect(res.body.key).toBe('aiFeatureUnknown')
    })
  })
})
