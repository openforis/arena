import { requireAiFeaturePermission } from '@server/modules/ai/api/aiMiddleware'
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
