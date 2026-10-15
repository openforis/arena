import * as SettingsApi from '@server/modules/ai/api/settingsApi'
import { createProviderRateLimit, limitProviderCalls } from '@server/modules/ai/api/providerRateLimit'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'
import { collectRoutes } from '@test/utils/routeUtils'

describe('Rate limit of the calls to the endpoints of the providers (307)', () => {
  test('a user over the limit is refused with 429 "aiRateLimited" and the request goes no further', () => {
    const limiter = createRateLimiter({ limitPerMinute: 2 })
    const middleware = createProviderRateLimit({ limiter })
    const next = jest.fn()
    const call = (uuid: string) => {
      const res = createFakeResponse()
      middleware({ user: { uuid } }, res, next)
      return res
    }
    expect(call('u1').statusCode).not.toBe(429)
    expect(call('u1').statusCode).not.toBe(429)
    expect(next).toHaveBeenCalledTimes(2)
    const refused = call('u1')
    expect(next).toHaveBeenCalledTimes(2)
    expect(refused.statusCode).toBe(429)
    expect(JSON.stringify(refused.body)).toContain('aiRateLimited')
    // the limit is per user
    call('u2')
    expect(next).toHaveBeenCalledTimes(3)
  })

  test('a user with 3 calls in flight is refused a 4th, and a finished call frees its place', () => {
    const middleware = createProviderRateLimit({ limiter: createRateLimiter({ limitPerMinute: 100 }) })
    const next = jest.fn()
    const call = (uuid: string) => {
      const res = createFakeResponse()
      middleware({ user: { uuid } }, res, next)
      return res
    }
    const running = [call('u1'), call('u1'), call('u1')]
    expect(next).toHaveBeenCalledTimes(3)
    const refused = call('u1')
    expect(refused.statusCode).toBe(429)
    expect(JSON.stringify(refused.body)).toContain('aiRateLimited')
    expect(next).toHaveBeenCalledTimes(3)
    // the cap is per user
    call('u2')
    expect(next).toHaveBeenCalledTimes(4)
    running[0].emit('close')
    call('u1')
    expect(next).toHaveBeenCalledTimes(5)
    // a call counts once, however many times the response closes
    running[0].emit('close')
    expect(call('u1').statusCode).toBe(429)
  })

  test('the routes that connect to a provider endpoint are limited, the others are not', () => {
    const routes = collectRoutes(SettingsApi.init)
    const limited = routes
      .filter((route) => route.handlers.includes(limitProviderCalls))
      .map(({ method, path }) => `${method} ${path}`)
    expect(limited.sort()).toEqual([
      'post /ai/providers',
      'post /ai/providers/models',
      'post /ai/providers/test',
      'put /ai/providers/:id',
    ])
    // the limiter runs after the checks of the user and before the handler
    for (const route of routes.filter((r) => r.handlers.includes(limitProviderCalls))) {
      const index = route.handlers.indexOf(limitProviderCalls)
      expect(index).toBe(route.handlers.length - 2)
      expect(index).toBeGreaterThan(0)
    }
  })
})
