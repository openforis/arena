import { AiFeaturePermission, AiFeatures, getAiFeature } from '@common/ai/features'
import { permissionMiddlewares, requireAiFeaturePermission } from '@server/modules/ai/api/aiMiddleware'
import { createFakeRequest, createFakeResponse } from '@test/unit/utils/fakeExpress'

const gatewayKeys = Object.values(AiFeatures)
  .filter(({ gateway }) => gateway)
  .map(({ key }) => key)
const surveyKeys = gatewayKeys.filter((key) => getAiFeature(key).permission !== AiFeaturePermission.loggedIn)
const loginOnlyKeys = gatewayKeys.filter((key) => getAiFeature(key).permission === AiFeaturePermission.loggedIn)

describe('POST /ai/model: the survey of the request (463)', () => {
  const original = { ...permissionMiddlewares }
  let permissionChecked: string[]

  beforeEach(() => {
    permissionChecked = []
    for (const permission of Object.keys(permissionMiddlewares)) {
      permissionMiddlewares[permission] = (_req, _res, next) => {
        permissionChecked.push(permission)
        next()
      }
    }
  })

  afterEach(() => {
    Object.assign(permissionMiddlewares, original)
  })

  const run = async (body: object) => {
    const res = createFakeResponse()
    let nextCalled = false
    await requireAiFeaturePermission(createFakeRequest(body), res, () => {
      nextCalled = true
    })
    return { res, nextCalled }
  }

  test('the registry has features of both kinds', () => {
    expect(surveyKeys.length).toBeGreaterThan(0)
    expect(loginOnlyKeys.length).toBeGreaterThan(0)
  })

  test.each(surveyKeys)('%s without a surveyId is 400 aiCallInvalid, and no permission is checked', async (feature) => {
    for (const body of [{ feature }, { feature, surveyId: null }]) {
      const { res, nextCalled } = await run(body)
      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({ key: 'aiCallInvalid', params: { reason: 'surveyId' } })
      expect(nextCalled).toBe(false)
    }
    expect(permissionChecked).toEqual([])
  })

  test.each(surveyKeys)('%s with a surveyId goes on to its permission check', async (feature) => {
    const { nextCalled } = await run({ feature, surveyId: 1 })
    expect(nextCalled).toBe(true)
    expect(permissionChecked).toEqual([getAiFeature(feature).permission])
  })

  test.each(loginOnlyKeys)('%s needs no surveyId', async (feature) => {
    const { nextCalled } = await run({ feature })
    expect(nextCalled).toBe(true)
  })
})
