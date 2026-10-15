import { ENV } from '@core/processUtils'

import * as CategoryApi from '@server/modules/category/api/categoryApi'
import * as RecordApi from '@server/modules/record/api/recordApi'

import { createFakeResponse } from '@test/unit/utils/fakeExpress'

// the routes load the user service (mailer, markdown parser): the routes under test use neither
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

// every AI category on, as saved by the AI settings
const aiUser = {
  uuid: 'u1',
  prefs: { ai: { accessLevel: 3, featureToggles: { assistantCleaning: true, assistantDesign: true } } },
}
const aiOffUser = { uuid: 'u2', prefs: { ai: { accessLevel: 0 } } }

const writeRoutes = [
  {
    name: 'the batch record edit',
    init: RecordApi.init,
    method: 'post',
    path: '/survey/:surveyId/records/nodes/update',
    feature: 'assistantCleaning',
  },
  {
    name: 'the category item labels update',
    init: CategoryApi.init,
    method: 'put',
    path: '/survey/:surveyId/categories/items/labels',
    feature: 'assistantDesign',
  },
]

/**
 * Calls the route handler (the last one of its chain, after the permission middlewares) with an empty body.
 * @param {object} params - The parameters.
 * @param {Function} params.init - The init function of the API module.
 * @param {string} params.method - The http method.
 * @param {string} params.path - The route path.
 * @returns {Promise<{res: object, next: jest.Mock}>} The fake response and the next callback.
 */
const callRoute = async (
  { init, method, path }: { init: (app: any) => void; method: string; path: string },
  user: object = aiUser
) => {
  const route = collectRoutes(init).find((r) => r.method === method && r.path === path)
  const res = createFakeResponse()
  const next = jest.fn()
  await route!.handlers.at(-1)({ params: { surveyId: '1' }, query: {}, body: {}, user }, res, next)
  return { res, next }
}

describe('the AI write routes are off when AI is off (346)', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test.each(writeRoutes)(
    '$name answers 404 aiFeaturesDisabled when the server has the AI features off',
    async (route) => {
      jest.replaceProperty(ENV, 'aiFeaturesEnabled', false)

      const { res, next } = await callRoute(route)

      expect(next).not.toHaveBeenCalled()
      expect(res.statusCode).toBe(404)
      expect(res.body).toMatchObject({ status: 'error', key: 'aiFeaturesDisabled', params: { feature: route.feature } })
    }
  )

  test.each(writeRoutes)(
    '$name answers 403 aiFeatureDisabled when the server flags turn its feature off',
    async (route) => {
      jest.replaceProperty(ENV, 'aiFeaturesEnabled', true)
      jest.replaceProperty(ENV, 'aiFeatureFlags', { [route.feature]: false })

      const { res } = await callRoute(route)

      expect(res.statusCode).toBe(403)
      expect(res.body).toMatchObject({ status: 'error', key: 'aiFeatureDisabled', params: { feature: route.feature } })
    }
  )

  test.each(writeRoutes)('$name answers 403 aiFeaturesDisabled to a user who turned the AI off', async (route) => {
    jest.replaceProperty(ENV, 'aiFeaturesEnabled', true)
    jest.replaceProperty(ENV, 'aiFeatureFlags', null)

    const { res } = await callRoute(route, aiOffUser)

    expect(res.statusCode).toBe(403)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiFeaturesDisabled' })
  })

  test.each(writeRoutes)(
    '$name keeps its own answer when the feature is on (an empty body is refused)',
    async (route) => {
      jest.replaceProperty(ENV, 'aiFeaturesEnabled', true)
      jest.replaceProperty(ENV, 'aiFeatureFlags', null)

      const { res } = await callRoute(route)

      expect(res.body).toMatchObject({ status: 'error' })
      expect(res.body.key).not.toMatch(/^aiFeature/)
    }
  )
})
