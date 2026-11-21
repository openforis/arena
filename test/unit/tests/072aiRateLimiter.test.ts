import { getNumberOrDefault } from '@core/processUtils'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'

describe('createRateLimiter', () => {
  test('allows up to the limit per minute per key, then frees slots as time passes', () => {
    let time = 0
    const limiter = createRateLimiter({ limitPerMinute: 2, now: () => time })
    expect(limiter.take('ann')).toBe(true)
    expect(limiter.take('ann')).toBe(true)
    expect(limiter.take('ann')).toBe(false)
    expect(limiter.take('bob')).toBe(true)
    time = 60_001
    expect(limiter.take('ann')).toBe(true)
  })

  test('keys whose calls all left the window are dropped once the map passes 10,000 entries', () => {
    let time = 0
    const limiter = createRateLimiter({ limitPerMinute: 2, now: () => time })
    for (let i = 0; i <= 10_000; i += 1) limiter.take(`user-${i}`)
    time = 60_001
    const deleteSpy = jest.spyOn(Map.prototype, 'delete')
    try {
      limiter.take('someone-new')
      expect(deleteSpy.mock.calls.length).toBeGreaterThan(10_000)
    } finally {
      deleteSpy.mockRestore()
    }
  })

  test('a limit of 0 disables limiting', () => {
    const limiter = createRateLimiter({ limitPerMinute: 0 })
    for (let i = 0; i < 100; i += 1) expect(limiter.take('ann')).toBe(true)
  })
})
describe('getNumberOrDefault (AI_RATE_LIMIT_PER_MINUTE parsing)', () => {
  test.each([
    [undefined, 30],
    ['', 30],
    ['  ', 30],
    ['abc', 30],
    ['0', 0],
    ['10', 10],
  ])('%p gives %p', (value, expected) => {
    expect(getNumberOrDefault(value, 30)).toBe(expected)
  })
})
