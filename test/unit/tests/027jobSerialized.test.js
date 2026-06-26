import * as JobSerialized from '@common/job/jobSerialized'

describe('JobSerialized.getRemainingMillis', () => {
  test('returns null when progressPercent is 0', () => {
    const job = { progressPercent: 0, elapsedMillis: 5000, ended: false }
    expect(JobSerialized.getRemainingMillis(job)).toBeNull()
  })

  test('returns null when job has ended', () => {
    const job = { progressPercent: 50, elapsedMillis: 10000, ended: true }
    expect(JobSerialized.getRemainingMillis(job)).toBeNull()
  })

  test('estimates remaining time at 50% progress', () => {
    // 50% done in 10 000ms → 10 000ms remaining
    const job = { progressPercent: 50, elapsedMillis: 10000, ended: false }
    expect(JobSerialized.getRemainingMillis(job)).toBe(10000)
  })

  test('estimates remaining time at 25% progress', () => {
    // 25% done in 5 000ms → 15 000ms remaining
    const job = { progressPercent: 25, elapsedMillis: 5000, ended: false }
    expect(JobSerialized.getRemainingMillis(job)).toBe(15000)
  })

  test('estimates remaining time at 75% progress', () => {
    // 75% done in 9 000ms → 3 000ms remaining
    const job = { progressPercent: 75, elapsedMillis: 9000, ended: false }
    expect(JobSerialized.getRemainingMillis(job)).toBe(3000)
  })
})
