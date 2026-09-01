import { JobRepository } from '@openforis/arena-server'
import { db } from '@server/db/db'

import * as JobManager from '../../../server/job/jobManager'
import { jobStatus } from '../../../server/job/jobUtils'

const jobRow = {
  uuid: 'job-1',
  userUuid: 'user-1',
  surveyId: 42,
  type: 'DataExportJob',
  status: jobStatus.running,
  processed: 1,
  total: 2,
  props: {},
  dateCreated: new Date(),
  dateModified: new Date(),
}

describe('JobManager DB-backed polling', () => {
  let getByUuidSpy
  let getActiveByUserUuidSpy

  beforeAll(() => {
    getByUuidSpy = jest.spyOn(JobRepository, 'getByUuid')
    getActiveByUserUuidSpy = jest.spyOn(JobRepository, 'getActiveByUserUuid')
  })

  afterAll(() => {
    getByUuidSpy.mockRestore()
    getActiveByUserUuidSpy.mockRestore()
  })

  beforeEach(() => {
    getByUuidSpy.mockReset()
    getActiveByUserUuidSpy.mockReset()
  })

  test('getJobSummary reads from the DB when a row exists', async () => {
    getByUuidSpy.mockResolvedValue(jobRow)

    const summary = await JobManager.getJobSummary('job-1')

    expect(getByUuidSpy).toHaveBeenCalledWith('job-1')
    expect(summary.uuid).toBe('job-1')
    expect(summary.running).toBe(true)
  })

  test('getJobSummary falls back to local state when the DB has no row (e.g. a global job)', async () => {
    getByUuidSpy.mockResolvedValue(null)

    const summary = await JobManager.getJobSummary('unknown-uuid')

    expect(summary).toBeNull()
  })

  test('getActiveJobSummary reads from the DB when a row exists', async () => {
    getActiveByUserUuidSpy.mockResolvedValue(jobRow)

    const summary = await JobManager.getActiveJobSummary('user-1')

    expect(getActiveByUserUuidSpy).toHaveBeenCalledWith('user-1')
    expect(summary.uuid).toBe('job-1')
  })

  test('getAllJobsSummary maps every row from the DB through jobRowToMonitorSummary', async () => {
    const dbMapSpy = jest.spyOn(db, 'map').mockImplementation(async (query, params, rowMapper) => {
      // Simulate what pg-promise returns: raw snake_case rows from the database.
      // jobRepository.getAll will call rowMapper (rowToJob) on each, transforming to camelCase.
      // Then jobRowToMonitorSummary adds user and survey display fields.
      const rawRows = [
        {
          uuid: 'job-1',
          type: 'DataExportJob',
          status: jobStatus.running,
          processed: 1,
          total: 2,
          props: {},
          date_created: new Date('2026-08-24T10:00:00Z'),
          date_modified: new Date('2026-08-24T10:05:00Z'),
          user_uuid: 'user-1',
          user_name: 'Jane Doe',
          user_email: 'jane@example.org',
          survey_id: 42,
          survey_name: 'Survey A',
        },
        {
          uuid: 'job-2',
          type: 'MessageSendJob',
          status: jobStatus.pending,
          processed: 0,
          total: 1,
          props: {},
          date_created: new Date('2026-08-24T09:00:00Z'),
          date_modified: new Date('2026-08-24T09:00:00Z'),
          user_uuid: 'user-1',
          user_name: null,
          user_email: 'no-name@example.org',
          survey_id: null,
          survey_name: null,
        },
      ]
      // Invoke the real rowMapper callback provided by jobRepository.getAll
      // to exercise the real snake_case -> camelCase transformation
      return rawRows.map(rowMapper)
    })

    const summaries = await JobManager.getAllJobsSummary()

    expect(dbMapSpy).toHaveBeenCalled()
    expect(summaries).toHaveLength(2)
    // Verify the transformation to camelCase and monitor summary fields (from jobRowToMonitorSummary)
    expect(summaries[0]).toMatchObject({
      uuid: 'job-1',
      type: 'DataExportJob',
      status: jobStatus.running,
      userName: 'Jane Doe',
      userEmail: 'jane@example.org',
      surveyName: 'Survey A',
    })
    expect(summaries[1]).toMatchObject({
      uuid: 'job-2',
      type: 'MessageSendJob',
      status: jobStatus.pending,
      userName: null,
      userEmail: 'no-name@example.org',
      surveyName: null,
    })

    dbMapSpy.mockRestore()
  })
})
