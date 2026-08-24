import { runWithClusterLock } from '@openforis/arena-server'

describe('scheduler cluster lock', () => {
  test('second concurrent call with the same lock name is skipped', async () => {
    const lockName = 'test-scheduler-lock-concurrent'
    let runCount = 0

    const results = await Promise.all([
      runWithClusterLock({
        lockName,
        fn: async () => {
          runCount += 1
        },
      }),
      runWithClusterLock({
        lockName,
        fn: async () => {
          runCount += 1
        },
      }),
    ])

    expect(runCount).toBe(1)
    expect(results.filter(Boolean).length).toBe(1)
  })
})
