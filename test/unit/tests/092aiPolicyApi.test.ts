import * as AuthGroup from '@core/auth/authGroup'

import { createSurveyAiPolicyRoutes } from '@server/modules/ai/api/surveyAiPolicyApi'
import { getSurveyAiPolicy, updateSurveyAiPolicy } from '@server/modules/ai/service/surveyAiPolicyService'
import { createRequireSurveyAiPolicyEditPermission } from '@server/modules/auth/authApiMiddleware'
import * as Response from '@server/utils/response'

import { createFakeRequest, createFakeResponse } from '@test/unit/utils/fakeExpress'

const surveyUuid = 'survey-1'
const surveyInfo = { uuid: surveyUuid }
const groupUser = (name: string) => ({ uuid: `u-${name}`, name, authGroups: [{ name, surveyUuid }] }) as any
const users = {
  viewer: groupUser(AuthGroup.groupNames.dataEditor),
  editor: groupUser(AuthGroup.groupNames.surveyEditor),
  surveyAdmin: groupUser(AuthGroup.groupNames.surveyAdmin),
  systemAdmin: { uuid: 'sa', name: 'sa', authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] } as any,
}

const createRoutes = ({ ceilings = { schema: 'cloud', data: 'cloud' } as any } = {}) => {
  const store: { raw: unknown; activities: unknown[] } = { raw: null, activities: [] }
  const serviceDeps = {
    fetchRawPolicy: async () => store.raw,
    storePolicy: async ({ policy }: any) => {
      store.raw = policy
    },
    insertActivityLog: async ({ content }: any) => {
      store.activities.push(content)
    },
    getCeilings: () => ceilings,
    runInTransaction: async (fn: any) => fn('tx'),
  }
  const fetchSurveyInfo = async () => surveyInfo
  const routes = createSurveyAiPolicyRoutes({
    // survey view permission belongs to arena-server: every user below may view the survey
    requireView: (_req: any, _res: any, next: any) => next(),
    requireEdit: createRequireSurveyAiPolicyEditPermission({ fetchSurveyInfo }),
    getPolicy: (surveyId: number) => getSurveyAiPolicy(surveyId, serviceDeps),
    updatePolicy: (params: any) => updateSurveyAiPolicy(params, serviceDeps),
    fetchSurveyInfo,
  })
  return { routes, store }
}

// runs a middleware chain like Express, sending errors like the app error handler
const runChain = async (
  handlers: Array<(...args: any[]) => unknown>,
  { user, body = {} }: { user: any; body?: unknown }
) => {
  const req = createFakeRequest(body)
  req.params = { surveyId: '3' }
  req.user = user
  const res = createFakeResponse()
  for (const handler of handlers) {
    const outcome: { called: boolean; error?: unknown } = { called: false }
    await handler(req, res, (error?: unknown) => {
      outcome.called = true
      outcome.error = error
    })
    if (outcome.error) {
      Response.sendErr(res, outcome.error)
      break
    }
    if (!outcome.called) break
  }
  return res
}

describe('GET /survey/:surveyId/ai-policy', () => {
  test.each([
    ['viewer', users.viewer, false],
    ['survey editor', users.editor, false],
    ['survey admin', users.surveyAdmin, true],
    ['system admin', users.systemAdmin, true],
  ])('%s reads the policy (canEdit %s)', async (_label, user, canEdit) => {
    const { routes } = createRoutes()
    const res = await runChain(routes.get, { user })
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      policy: { schema: 'cloud', data: 'onDevice' },
      ceilings: { schema: 'cloud', data: 'cloud' },
      effective: { schema: 'cloud', data: 'onDevice' },
      canEdit,
    })
  })
})

describe('PUT /survey/:surveyId/ai-policy', () => {
  test('viewer gets 403', async () => {
    const { routes, store } = createRoutes()
    const res = await runChain(routes.put, { user: users.viewer, body: { schema: 'cloud', data: 'cloud' } })
    expect(res.statusCode).toBe(403)
    expect(store.raw).toBeNull()
  })

  test('editor gets 403 on PUT', async () => {
    const { routes, store } = createRoutes()
    const res = await runChain(routes.put, { user: users.editor, body: { schema: 'cloud', data: 'cloud' } })
    expect(res.statusCode).toBe(403)
    expect(store.raw).toBeNull()
  })

  test.each([
    ['survey admin', users.surveyAdmin],
    ['system admin', users.systemAdmin],
  ])('%s updates the policy', async (_label, user) => {
    const { routes, store } = createRoutes()
    const res = await runChain(routes.put, { user, body: { schema: 'orgHosted', data: 'cloud' } })
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      policy: { schema: 'orgHosted', data: 'cloud' },
      ceilings: { schema: 'cloud', data: 'cloud' },
      effective: { schema: 'orgHosted', data: 'cloud' },
      canEdit: true,
    })
    expect(store.raw).toEqual({ schema: 'orgHosted', data: 'cloud' })
    expect(store.activities).toHaveLength(1)
  })

  test('an invalid body → 400 aiPolicyInvalid', async () => {
    const { routes } = createRoutes()
    const res = await runChain(routes.put, { user: users.surveyAdmin, body: { schema: 'cloud', data: 'anywhere' } })
    expect(res.statusCode).toBe(400)
    expect(res.body.key).toBe('aiPolicyInvalid')
  })

  test('above the ceiling → 400 aiPolicyAboveCeiling', async () => {
    const { routes, store } = createRoutes({ ceilings: { schema: 'cloud', data: 'orgHosted' } })
    const res = await runChain(routes.put, { user: users.surveyAdmin, body: { schema: 'cloud', data: 'cloud' } })
    expect(res.statusCode).toBe(400)
    expect(res.body.key).toBe('aiPolicyAboveCeiling')
    expect(res.body.params).toEqual({ dataClass: 'data', level: 'cloud', ceiling: 'orgHosted' })
    expect(store.raw).toBeNull()
  })

  test('an unchanged class above its ceiling does not block changing the other one', async () => {
    const { routes, store } = createRoutes({ ceilings: { schema: 'orgHosted', data: 'cloud' } })
    const res = await runChain(routes.put, { user: users.surveyAdmin, body: { schema: 'cloud', data: 'orgHosted' } })
    expect(res.statusCode).toBe(200)
    expect(store.raw).toEqual({ schema: 'cloud', data: 'orgHosted' })
  })
})
