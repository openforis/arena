import { ENV } from '@core/processUtils'

import * as SurveyApi from '@server/modules/survey/api/surveyApi'

import { createFakeResponse } from '@test/unit/utils/fakeExpress'

// the user service loads the mailer and the markdown parser: the routes under test use neither
jest.mock('@server/modules/user/service/userService', () => ({}))

type Route = { method: string; path: string; handlers: any[] }

/**
 * Collects the routes registered by an API module.
 * @param {Function} init - The init function of the API module.
 * @returns {Route[]} The routes.
 */
const collectRoutes = (init: (app: any) => void): Route[] => {
  const routes: Route[] = []
  const app = new Proxy(
    {},
    {
      get:
        (_target, method: string) =>
        (path: string, ...handlers: any[]) => {
          routes.push({ method, path, handlers })
        },
    }
  )
  init(app)
  return routes
}

const aiItemsPath = '/survey/:surveyId/schema-summary/ai-items'
const exportPath = '/survey/:surveyId/schema-summary/export'

/**
 * Calls the route handler (the last one of its chain, after the permission middlewares).
 * @param {object} params - The parameters.
 * @param {string} params.method - The http method.
 * @param {string} params.path - The route path.
 * @param {object} params.body - The request body.
 * @returns {Promise<{res: object, next: jest.Mock}>} The fake response and the next callback.
 */
const callRoute = async ({ method, path, body = {} }: { method: string; path: string; body?: object }) => {
  const route = collectRoutes(SurveyApi.init).find((r) => r.method === method && r.path === path)
  const handler = route!.handlers.at(-1)
  const res = createFakeResponse()
  const next = jest.fn()
  await handler({ params: { surveyId: '1' }, query: { cycle: '0' }, body, user: { uuid: 'u1' } }, res, next)
  return { res, next }
}

describe('schema summary routes send their errors as JSON with the error key (344)', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('the legacy includeAiDescriptions flag is refused with aiIncludeAiDescriptionsRemoved (400)', async () => {
    const { res, next } = await callRoute({ method: 'post', path: exportPath, body: { includeAiDescriptions: true } })

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiIncludeAiDescriptionsRemoved' })
  })

  test('the AI items of a server with the AI features off are refused with aiFeaturesDisabled (404)', async () => {
    jest.replaceProperty(ENV, 'aiFeaturesEnabled', false)

    const { res, next } = await callRoute({ method: 'get', path: aiItemsPath })

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 'error',
      key: 'aiFeaturesDisabled',
      params: { feature: 'dataDictionary' },
    })
  })

  test('the AI items of a feature turned off by the server flags are refused with aiFeatureDisabled (403)', async () => {
    jest.replaceProperty(ENV, 'aiFeaturesEnabled', true)
    jest.replaceProperty(ENV, 'aiFeatureFlags', { dataDictionary: false })

    const { res, next } = await callRoute({ method: 'get', path: aiItemsPath })

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiFeatureDisabled' })
  })

  test('the export with AI descriptions is refused with the same key when the feature is off', async () => {
    jest.replaceProperty(ENV, 'aiFeaturesEnabled', false)

    const { res, next } = await callRoute({ method: 'post', path: exportPath, body: { aiDescriptions: {} } })

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiFeaturesDisabled' })
  })
})
