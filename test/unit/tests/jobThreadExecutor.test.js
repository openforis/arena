import { JobRepository } from '@openforis/arena-server'
import { _notifyJobUpdateForTest as _notifyJobUpdate } from '../../../server/job/jobThreadExecutor'

describe('jobThreadExecutor DB persistence', () => {
  let updateProgressSpy
  let updateStatusSpy

  beforeAll(() => {
    updateProgressSpy = jest.spyOn(JobRepository, 'updateProgress')
    updateStatusSpy = jest.spyOn(JobRepository, 'updateStatus')
  })

  afterAll(() => {
    updateProgressSpy.mockRestore()
    updateStatusSpy.mockRestore()
  })

  beforeEach(() => {
    updateProgressSpy.mockReset().mockResolvedValue(undefined)
    updateStatusSpy.mockReset().mockResolvedValue({})
  })

  test('persists progress and status for a survey-scoped job update', async () => {
    await _notifyJobUpdate({
      uuid: 'job-1',
      userUuid: 'user-1',
      surveyId: 42,
      type: 'DataExportJob',
      status: 'running',
      processed: 1,
      total: 2,
      ended: false,
    })

    expect(updateProgressSpy).toHaveBeenCalledWith({ uuid: 'job-1', processed: 1, total: 2 })
    expect(updateStatusSpy).toHaveBeenCalledWith({ uuid: 'job-1', status: 'running' })
  })

  test('merges result/errors into props when a survey-scoped job ends', async () => {
    await _notifyJobUpdate({
      uuid: 'job-1',
      userUuid: 'user-1',
      surveyId: 42,
      type: 'DataExportJob',
      status: 'succeeded',
      processed: 2,
      total: 2,
      ended: true,
      result: { filePath: '/tmp/export.zip' },
      errors: {},
    })

    expect(updateStatusSpy).toHaveBeenCalledWith({
      uuid: 'job-1',
      status: 'succeeded',
      props: { result: { filePath: '/tmp/export.zip' }, errors: {} },
    })
  })

  test('does not persist anything for a global (no-surveyId) job', async () => {
    await _notifyJobUpdate({
      uuid: 'job-2',
      userUuid: 'user-1',
      surveyId: undefined,
      type: 'MessageSendJob',
      status: 'running',
      processed: 0,
      total: 1,
      ended: false,
    })

    expect(updateProgressSpy).not.toHaveBeenCalled()
    expect(updateStatusSpy).not.toHaveBeenCalled()
  })
})
