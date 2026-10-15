import * as AiApi from '@server/modules/ai/api/aiApi'
import { requireAiFeaturePermission, requireAiFeaturesEnabled } from '@server/modules/ai/api/aiMiddleware'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

type Route = { method: string; path: string; handlers: any[] }

/**
 * Collects the routes registered by an API module (method, path and the whole handler chain).
 * @param {(app: object) => void} init - The module `init`.
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

/**
 * Finds a route, failing the test when it is missing.
 * @param {Route[]} routes - Registered routes.
 * @param {string} method - HTTP method, lower case.
 * @param {string} path - Route path.
 * @returns {Route} The route.
 */
const findRoute = (routes: Route[], method: string, path: string): Route => {
  const route = routes.find((candidate) => candidate.method === method && candidate.path === path)
  if (!route) throw new Error(`Route not registered: ${method.toUpperCase()} ${path}`)
  return route
}

/**
 * Returns the position of a handler in a route chain, failing the test when it is missing.
 * @param {Route} route - The route.
 * @param {Function} handler - The handler to look for.
 * @returns {number} Its index.
 */
const indexOfHandler = (route: Route, handler: unknown): number => {
  const index = route.handlers.indexOf(handler)
  expect(index).toBeGreaterThanOrEqual(0)
  return index
}

// the route handlers are not run here: the integration test 056 runs them with real users
describe('AI route permissions: the middleware chain of every route (320)', () => {
  const aiRoutes = collectRoutes(AiApi.init)
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

  test.each(settingsRoutes)(
    '%s %s needs a logged in user and the AI switch, before its own handler',
    (method, path) => {
      const route = findRoute(aiRoutes, method, path)
      const loggedIn = indexOfHandler(route, AuthMiddleware.requireLoggedInUser)
      const aiEnabled = indexOfHandler(route, requireAiFeaturesEnabled)
      const own = route.handlers.length - 1
      expect(loggedIn).toBe(0)
      expect(aiEnabled).toBeGreaterThan(loggedIn)
      expect(own).toBeGreaterThan(aiEnabled)
    }
  )

  test('every AI route is covered by this file', () => {
    const covered = new Set([
      ...settingsRoutes.map(([method, path]) => `${method} ${path}`),
      'post /ai/model',
      'post /ai/_internal/ping',
      'get /survey/:surveyId/ai-policy',
      'put /survey/:surveyId/ai-policy',
    ])
    expect(aiRoutes.map(({ method, path }) => `${method} ${path}`).sort()).toEqual([...covered].sort())
  })

  test('POST /ai/model checks the AI switch, then the permission of the requested feature, then runs the gateway', () => {
    const route = findRoute(aiRoutes, 'post', '/ai/model')
    expect(route.handlers).toHaveLength(3)
    expect(route.handlers.slice(0, 2)).toEqual([requireAiFeaturesEnabled, requireAiFeaturePermission])
  })

  test('the internal ping is for system admins only, behind the AI switch', () => {
    const route = findRoute(aiRoutes, 'post', '/ai/_internal/ping')
    expect(route.handlers.slice(0, 3)).toEqual([
      AuthMiddleware.requireLoggedInUser,
      AuthMiddleware.requireAdminPermission,
      requireAiFeaturesEnabled,
    ])
  })

  test('the survey AI policy: GET needs survey view, PUT needs the AI policy edit permission', () => {
    expect(findRoute(aiRoutes, 'get', '/survey/:surveyId/ai-policy').handlers[0]).toBe(
      AuthMiddleware.requireSurveyViewPermission
    )
    expect(findRoute(aiRoutes, 'put', '/survey/:surveyId/ai-policy').handlers[0]).toBe(
      AuthMiddleware.requireSurveyAiPolicyEditPermission
    )
  })
})
