import { createProviderRateLimit, MAX_IN_FLIGHT_PER_USER } from '@server/modules/ai/api/providerRateLimit'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'

describe('Cap of provider calls in flight: default and "unlimited" (460)', () => {
  const callMany = (maxInFlight: number | undefined, calls: number) => {
    const middleware = createProviderRateLimit({ limiter: createRateLimiter({ limitPerMinute: 0 }), maxInFlight })
    const next = jest.fn()
    const statuses = Array.from({ length: calls }, () => {
      const res = createFakeResponse()
      middleware({ user: { uuid: 'u1' } }, res, next)
      return res.statusCode
    })
    return { statuses, accepted: next.mock.calls.length }
  }

  test('the default is 3 when AI_PROVIDER_MAX_IN_FLIGHT_PER_USER is not set', () => {
    expect(MAX_IN_FLIGHT_PER_USER).toBe(3)
    expect(callMany(undefined, 5).accepted).toBe(3)
  })

  test('a cap of 0 means unlimited (the e2e server sets it)', () => {
    const { statuses, accepted } = callMany(0, 20)
    expect(accepted).toBe(20)
    expect(statuses.every((status) => status !== 429)).toBe(true)
  })

  test('a cap above the default lets that many calls run at the same time', () => {
    expect(callMany(5, 8).accepted).toBe(5)
  })
})
