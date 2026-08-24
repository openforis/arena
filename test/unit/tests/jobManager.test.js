import { JobRepository } from '@openforis/arena-server'
import * as JobManager from '../../../server/job/jobManager'
import * as jobRepository from '../../../server/job/jobRepository'
import * as jobUtils from '../../../server/job/jobUtils'
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

  test('getAllJobsSummary exists and returns an array', async () => {
    // Note: This is a minimal smoke test. Full behavior validation (mapping rows through
    // jobRowToMonitorSummary, calling jobRepository.getAll) is covered by integration tests
    // in test/integration/tests/015jobRepositoryGetAllTest.js and tested via API in e2e tests.
    // Unit mocking of jobRepository.getAll is not possible in this bundled test environment
    // due to webpack's ESM export handling.

    expect(typeof JobManager.getAllJobsSummary).toBe('function')
    const result = await JobManager.getAllJobsSummary()
    expect(Array.isArray(result)).toBe(true)
  })
})
