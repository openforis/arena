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

describe('JobSerialized.getInnerJobStatusIconClass', () => {
  test('returns checked icon when inner job succeeded', () => {
    const innerJob = { succeeded: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, false)).toBe('icon-checkbox-checked')
  })

  test('returns cross icon when inner job failed', () => {
    const innerJob = { failed: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, false)).toBe('icon-cross')
  })

  test('returns spinner icon when inner job is the current running job', () => {
    const innerJob = { pending: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, true)).toBe('icon-spinner')
  })

  test('returns unchecked icon when inner job has not started yet', () => {
    const innerJob = { pending: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, false)).toBe('icon-checkbox-unchecked')
  })

  test('prioritizes succeeded status even if job object is still flagged as current', () => {
    const innerJob = { succeeded: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, true)).toBe('icon-checkbox-checked')
  })

  test('prioritizes failed status even if job object is still flagged as current', () => {
    const innerJob = { failed: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, true)).toBe('icon-cross')
  })
})
