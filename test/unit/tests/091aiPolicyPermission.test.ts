import * as Authorizer from '@core/auth/authorizer'
import * as AuthGroup from '@core/auth/authGroup'

import { createRequireSurveyAiPolicyEditPermission } from '@server/modules/auth/authApiMiddleware'

import { createFakeRequest, createFakeResponse } from '@test/unit/utils/fakeExpress'

const surveyUuid = 'survey-1'
const surveyInfo = { uuid: surveyUuid }

const userWithGroup = (groupName: string, uuid = 'u-1') =>
  ({ uuid, name: `user ${groupName}`, authGroups: [{ name: groupName, surveyUuid }] }) as any
const systemAdmin = { uuid: 'sa', name: 'admin', authGroups: [{ name: AuthGroup.groupNames.systemAdmin }] } as any

describe('Authorizer.canEditSurveyAiPolicy', () => {
  test('system admin can edit', () => {
    expect(Authorizer.canEditSurveyAiPolicy(systemAdmin, surveyInfo as any)).toBe(true)
  })

  test('survey admin of the survey can edit', () => {
    expect(Authorizer.canEditSurveyAiPolicy(userWithGroup(AuthGroup.groupNames.surveyAdmin), surveyInfo as any)).toBe(
      true
    )
  })

  test('survey editor cannot edit', () => {
    expect(Authorizer.canEditSurveyAiPolicy(userWithGroup(AuthGroup.groupNames.surveyEditor), surveyInfo as any)).toBe(
      false
    )
  })

  test('data editor and viewer cannot edit', () => {
    expect(Authorizer.canEditSurveyAiPolicy(userWithGroup(AuthGroup.groupNames.dataEditor), surveyInfo as any)).toBe(
      false
    )
    expect(Authorizer.canEditSurveyAiPolicy(userWithGroup(AuthGroup.groupNames.surveyGuest), surveyInfo as any)).toBe(
      false
    )
  })

  test('admin of another survey cannot edit', () => {
    const user = { uuid: 'x', authGroups: [{ name: AuthGroup.groupNames.surveyAdmin, surveyUuid: 'other' }] } as any
    expect(Authorizer.canEditSurveyAiPolicy(user, surveyInfo as any)).toBe(false)
  })

  test('no user cannot edit', () => {
    expect(Authorizer.canEditSurveyAiPolicy(null, surveyInfo as any)).toBe(false)
  })
})

describe('requireSurveyAiPolicyEditPermission', () => {
  const run = async (user: any, fetchSurveyInfo = async () => surveyInfo) => {
    const middleware = createRequireSurveyAiPolicyEditPermission({ fetchSurveyInfo })
    const req = createFakeRequest({})
    req.params = { surveyId: '3' }
    req.user = user
    const res = createFakeResponse()
    const nextCalls: unknown[] = []
    await middleware(req, res, (error?: unknown) => nextCalls.push(error))
    return { res, nextCalls }
  }

  test('survey admin passes', async () => {
    const { nextCalls } = await run(userWithGroup(AuthGroup.groupNames.surveyAdmin))
    expect(nextCalls).toEqual([undefined])
  })

  test('survey editor gets 403', async () => {
    const { res, nextCalls } = await run(userWithGroup(AuthGroup.groupNames.surveyEditor))
    expect(res.statusCode).toBe(403)
    expect(nextCalls).toEqual([])
  })

  test('a failing survey fetch goes to next(error)', async () => {
    const failure = new Error('db down')
    const { nextCalls } = await run(systemAdmin, async () => {
      throw failure
    })
    expect(nextCalls).toEqual([failure])
  })
})
