import { jobRowToMonitorSummary, jobStatus } from '../../../server/job/jobUtils'
import * as JobSerialized from '@common/job/jobSerialized'

describe('jobRowToMonitorSummary', () => {
  test('extends jobRowToSummary with dateCreated, user and survey display fields', () => {
    const dateCreated = new Date('2026-08-19T10:00:00.000Z')
    const row = {
      uuid: 'job-1',
      type: 'DataExportJob',
      status: jobStatus.running,
      processed: 3,
      total: 10,
      props: {},
      dateCreated,
      dateModified: new Date('2026-08-19T10:00:05.000Z'),
      userUuid: 'user-1',
      userName: 'Jane Doe',
      userEmail: 'jane@example.org',
      surveyId: 42,
      surveyName: 'My Survey',
    }

    const summary = jobRowToMonitorSummary(row)

    // still a valid JobSerialized-shaped object
    expect(JobSerialized.getUuid(summary)).toBe('job-1')
    expect(JobSerialized.getProgressPercent(summary)).toBe(30)
    // plus the monitor-only fields
    expect(summary.dateCreated).toBe(dateCreated)
    expect(summary.userName).toBe('Jane Doe')
    expect(summary.userEmail).toBe('jane@example.org')
    expect(summary.surveyName).toBe('My Survey')
  })

  test('passes through null survey fields for a global job', () => {
    const row = {
      uuid: 'job-2',
      type: 'MessageSendJob',
      status: jobStatus.pending,
      processed: 0,
      total: 1,
      props: {},
      dateCreated: new Date(),
      dateModified: new Date(),
      userUuid: 'user-1',
      userName: 'Jane Doe',
      userEmail: 'jane@example.org',
      surveyId: null,
      surveyName: null,
    }

    const summary = jobRowToMonitorSummary(row)

    expect(summary.surveyName).toBeNull()
  })
})
