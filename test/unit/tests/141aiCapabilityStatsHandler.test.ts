import type { User } from '@openforis/arena-core'

import { handleCapabilityStats } from '@server/modules/ai/service/capabilityStatsService'

const stats = { webGpu: true, deviceMemoryBucket: '4', promptApi: null, localServer: 'onDevice', browser: 'firefox' }

const userWithAi = (ai: object | undefined): User =>
  ({ uuid: 'user-uuid', email: 'someone@example.org', prefs: ai ? { ai } : {} }) as unknown as User

const run = (user: User, body: unknown) => {
  const recorded: unknown[] = []
  const result = handleCapabilityStats({ user, body, record: (value) => recorded.push(value) })
  return { result, recorded }
}

describe('handleCapabilityStats', () => {
  test('records the statistics, and nothing else, when the user opted in', () => {
    const { result, recorded } = run(userWithAi({ capabilityStats: true }), stats)
    expect(result).toBe(true)
    expect(recorded).toEqual([stats])
    expect(JSON.stringify(recorded)).not.toMatch(/user-uuid|example\.org/)
  })

  test('ignores the statistics of a user who did not opt in', () => {
    expect(run(userWithAi({ featuresEnabled: true }), stats)).toEqual({ result: false, recorded: [] })
    expect(run(userWithAi(undefined), stats)).toEqual({ result: false, recorded: [] })
  })

  test('refuses an invalid body with aiCapabilityStatsInvalid (400)', () => {
    let error: any = null
    try {
      run(userWithAi({ capabilityStats: true }), { ...stats, baseUrl: 'http://localhost:1234/v1' })
    } catch (e) {
      error = e
    }
    expect(error?.key).toBe('aiCapabilityStatsInvalid')
    expect(error?.statusCode).toBe(400)
  })
})
