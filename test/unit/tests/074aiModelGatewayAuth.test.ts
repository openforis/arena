import { AiFeatures, getAiFeature, isGatewayFeature } from '@common/ai/features'
import { permissionMiddlewares, requireAiFeaturePermission } from '@server/modules/ai/api/aiMiddleware'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import SystemError, { StatusCodes } from '@core/systemError'
import * as Response from '@server/utils/response'
import { createFakeRequest, createFakeResponse } from '@test/unit/utils/fakeExpress'

const runMiddleware = async (body: any, user: any = null) => {
  const req: any = createFakeRequest(body)
  req.user = user
  const res = createFakeResponse()
  let nextArg: unknown = 'not called'
  await requireAiFeaturePermission(req, res, (arg?: unknown) => {
    nextArg = arg
  })
  return { res, nextArg }
}

describe('requireAiFeaturePermission', () => {
  test.each(['nope', 'dataDictionary', 'internalPing', undefined])(
    'refuses feature %p with 400 aiFeatureUnknown',
    async (feature) => {
      const { res, nextArg } = await runMiddleware({ feature })
      expect(res.statusCode).toBe(400)
      expect(res.body.key).toBe('aiFeatureUnknown')
      expect(nextArg).toBe('not called')
    }
  )

  test('chat: anonymous → 401 written by requireLoggedInUser, logged in → next()', async () => {
    const anonymous = await runMiddleware({ feature: 'chatbot' })
    expect(anonymous.res.statusCode).toBe(401)
    expect(anonymous.nextArg).toBe('not called')

    // Request.getUser reads req.user
    const loggedIn = await runMiddleware({ feature: 'chatbot' }, { uuid: 'u1' })
    expect(loggedIn.nextArg).toBeUndefined()
  })
})

describe('gateway feature → permission middleware mapping', () => {
  const expected: Record<string, unknown> = {
    expressionGenerate: AuthMiddleware.requireSurveyEditPermission,
    expressionExplain: AuthMiddleware.requireSurveyEditPermission,
    translation: AuthMiddleware.requireSurveyEditPermission,
    dataQueryGenerate: AuthMiddleware.requireRecordListViewPermission,
    dataQuerySummarize: AuthMiddleware.requireRecordListViewPermission,
    activityLogSummary: AuthMiddleware.requireSurveyViewPermission,
    chatbot: AuthMiddleware.requireLoggedInUser,
    assistantDesign: AuthMiddleware.requireSurveyEditPermission,
  }
  const gatewayFeatures = Object.keys(AiFeatures).filter((feature) => isGatewayFeature(feature))

  test('every gateway feature is covered by this table', () => {
    expect(gatewayFeatures.sort()).toEqual(Object.keys(expected).sort())
  })

  test.each(Object.keys(expected))('%s resolves to its expected middleware', (feature) => {
    expect(permissionMiddlewares[getAiFeature(feature).permission]).toBe(expected[feature])
  })

  test('a refusing permission middleware answers 403 and the gateway handler is never reached', async () => {
    const original = permissionMiddlewares[getAiFeature('translation').permission]
    permissionMiddlewares[getAiFeature('translation').permission] = (_req, res) => {
      Response.sendErr(res, new SystemError('forbidden', {}, StatusCodes.FORBIDDEN))
    }
    let providerCalled = false
    try {
      const req: any = createFakeRequest({ feature: 'translation', surveyId: 1 })
      const res = createFakeResponse()
      await requireAiFeaturePermission(req, res, () => {
        providerCalled = true
      })
      expect(res.statusCode).toBe(403)
    } finally {
      permissionMiddlewares[getAiFeature('translation').permission] = original
    }
    expect(providerCalled).toBe(false)
  })
})
