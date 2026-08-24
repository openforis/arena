import { JobStatus } from '@openforis/arena-core'

import * as JobSerialized from '@common/job/jobSerialized'
import { jobRowToSummary, jobStatus } from '../../../server/job/jobUtils'

describe('jobRowToSummary', () => {
  test('maps a running job row', () => {
    const dateCreated = new Date('2026-08-19T10:00:00.000Z')
    const jobRow = {
      uuid: 'job-1',
      userUuid: 'user-1',
      surveyId: 42,
      type: 'DataExportJob',
      status: jobStatus.running,
      processed: 3,
      total: 10,
      props: {},
      dateCreated,
      dateModified: new Date('2026-08-19T10:00:05.000Z'),
    }

    const summary = jobRowToSummary(jobRow)

    expect(JobSerialized.getUuid(summary)).toBe('job-1')
    expect(JobSerialized.getStatus(summary)).toBe(jobStatus.running)
    expect(JobSerialized.isRunning(summary)).toBe(true)
    expect(JobSerialized.isEnded(summary)).toBe(false)
    expect(JobSerialized.getProgressPercent(summary)).toBe(30)
  })

  test('maps a succeeded job row with a result in props', () => {
    const jobRow = {
      uuid: 'job-2',
      userUuid: 'user-1',
      surveyId: 42,
      type: 'DataExportJob',
      status: jobStatus.succeeded,
      processed: 10,
      total: 10,
      props: { result: { filePath: '/tmp/export.zip' } },
      dateCreated: new Date('2026-08-19T10:00:00.000Z'),
      dateModified: new Date('2026-08-19T10:00:05.000Z'),
    }

    const summary = jobRowToSummary(jobRow)

    expect(JobSerialized.isSucceeded(summary)).toBe(true)
    expect(JobSerialized.isEnded(summary)).toBe(true)
    expect(JobSerialized.getProgressPercent(summary)).toBe(100)
    expect(JobSerialized.getResult(summary)).toEqual({ filePath: '/tmp/export.zip' })
  })

  test('arena job statuses match @openforis/arena-core JobStatus values used by JobRepository.insert', () => {
    expect(jobStatus.pending).toBe(JobStatus.pending)
    expect(jobStatus.running).toBe(JobStatus.running)
    expect(jobStatus.succeeded).toBe(JobStatus.succeeded)
    expect(jobStatus.canceled).toBe(JobStatus.canceled)
    expect(jobStatus.failed).toBe(JobStatus.failed)
  })
})
