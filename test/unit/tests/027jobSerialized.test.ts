import * as JobSerialized from '@common/job/jobSerialized'

// a partial serialized job (only the progress fields)
type SerializedJob = Parameters<typeof JobSerialized.getRemainingMillis>[0]

describe('JobSerialized.getRemainingMillis', () => {
  test('returns null when progressPercent is 0', () => {
    const job = { progressPercent: 0, elapsedMillis: 5000, ended: false }
    expect(JobSerialized.getRemainingMillis(job as SerializedJob)).toBeNull()
  })

  test('returns null when job has ended', () => {
    const job = { progressPercent: 50, elapsedMillis: 10000, ended: true }
    expect(JobSerialized.getRemainingMillis(job as SerializedJob)).toBeNull()
  })

  test('estimates remaining time at 50% progress', () => {
    // 50% done in 10 000ms → 10 000ms remaining
    const job = { progressPercent: 50, elapsedMillis: 10000, ended: false }
    expect(JobSerialized.getRemainingMillis(job as SerializedJob)).toBe(10000)
  })

  test('estimates remaining time at 25% progress', () => {
    // 25% done in 5 000ms → 15 000ms remaining
    const job = { progressPercent: 25, elapsedMillis: 5000, ended: false }
    expect(JobSerialized.getRemainingMillis(job as SerializedJob)).toBe(15000)
  })

  test('estimates remaining time at 75% progress', () => {
    // 75% done in 9 000ms → 3 000ms remaining
    const job = { progressPercent: 75, elapsedMillis: 9000, ended: false }
    expect(JobSerialized.getRemainingMillis(job as SerializedJob)).toBe(3000)
  })

  test('estimates remaining time with inner jobs using completed avg duration', () => {
    const job = {
      progressPercent: 50,
      elapsedMillis: 10000,
      ended: false,
      innerJobs: [
        { progressPercent: 100, elapsedMillis: 10000, ended: true },
        { progressPercent: 50, elapsedMillis: 5000, ended: false, running: true },
        { progressPercent: 0, elapsedMillis: 0, ended: false },
      ],
      currentInnerJobIndex: 1,
    }

    expect(JobSerialized.getRemainingMillis(job as SerializedJob)).toBe(15000)
  })

  test('estimates remaining time with inner jobs using current job rate when no completed jobs exist', () => {
    const job = {
      progressPercent: 10,
      elapsedMillis: 5000,
      ended: false,
      innerJobs: [
        { progressPercent: 25, elapsedMillis: 5000, ended: false, running: true },
        { progressPercent: 0, elapsedMillis: 0, ended: false },
        { progressPercent: 0, elapsedMillis: 0, ended: false },
      ],
      currentInnerJobIndex: 0,
    }

    expect(JobSerialized.getRemainingMillis(job as SerializedJob)).toBe(55000)
  })
})
