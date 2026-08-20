import { UUIDs } from '@openforis/arena-core'
import { JobRepository, WebSocketServer } from '@openforis/arena-server'

import Job from '../../../server/job/job'
import { JobQueue } from '../../../server/job/JobQueue'
import { jobStatus } from '../../../server/job/jobUtils'

class TestJobQueue extends JobQueue {
  constructor(jobExecutorListener) {
    super()
    this.jobExecutorListener = jobExecutorListener
  }

  _executeJob(jobInfo) {
    const _this = this

    setTimeout(() => {
      jobInfo.status = jobStatus.succeeded
      _this.onJobEnd(jobInfo)
      this.jobExecutorListener(jobInfo)
    }, 200)
  }
}

const runDelayed = (func) => () => {
  setTimeout(func, 200)
}

const enqueueJobs = async ({ jobs }) => {
  const executedJobUuids = []
  await new Promise((resolve, reject) => {
    const queue = new TestJobQueue((jobExecuted) => {
      executedJobUuids.push(jobExecuted.uuid)
      if (executedJobUuids.length === jobs.length) {
        resolve()
      }
    })
    jobs.some((job) => {
      try {
        queue.enqueue(job)
        return false
      } catch (error) {
        queue.destroy().then(runDelayed(() => reject(error)))
        return true
      }
    })
  })
  return executedJobUuids
}

const enqueueJobsAndExpectExecutionOrder = async ({ jobs, expectedExecutedJobUuids }) => {
  const executedJobUuids = await enqueueJobs({ jobs })
  expect(executedJobUuids).toEqual(expectedExecutedJobUuids)
}

const surveyId1 = 1
const surveyId2 = 2

const user1 = { uuid: UUIDs.v4() }
const user2 = { uuid: UUIDs.v4() }
const user3 = { uuid: UUIDs.v4() }
const user4 = { uuid: UUIDs.v4() }

describe('JobQueue test', () => {
  let jobRepositoryInsertSpy
  let getActiveByUserUuidSpy
  let getActiveBySurveyIdSpy
  let updateStatusSpy
  let notifyUserSpy

  beforeAll(() => {
    jobRepositoryInsertSpy = jest.spyOn(JobRepository, 'insert').mockResolvedValue({})
    getActiveByUserUuidSpy = jest.spyOn(JobRepository, 'getActiveByUserUuid').mockResolvedValue(null)
    getActiveBySurveyIdSpy = jest.spyOn(JobRepository, 'getActiveBySurveyId').mockResolvedValue(null)
    updateStatusSpy = jest.spyOn(JobRepository, 'updateStatus').mockResolvedValue({})
    notifyUserSpy = jest.spyOn(WebSocketServer, 'notifyUser').mockImplementation(() => {})
  })

  afterAll(() => {
    jobRepositoryInsertSpy.mockRestore()
    getActiveByUserUuidSpy.mockRestore()
    getActiveBySurveyIdSpy.mockRestore()
    updateStatusSpy.mockRestore()
    notifyUserSpy.mockRestore()
  })

  beforeEach(() => {
    getActiveByUserUuidSpy.mockReset().mockResolvedValue(null)
    getActiveBySurveyIdSpy.mockReset().mockResolvedValue(null)
    updateStatusSpy.mockReset().mockResolvedValue({})
    notifyUserSpy.mockReset().mockImplementation(() => {})
  })

  test('user can enqueue only one job', async () => {
    const job1 = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })
    const job2 = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })

    await expect(enqueueJobs({ jobs: [job1, job2] })).rejects.toThrow()
  })

  test('survey jobs executed sequentially', async () => {
    const job1 = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })
    const job2 = new Job('SurveyJob', { surveyId: surveyId1, user: user2 })
    const job3 = new Job('SurveyJob', { surveyId: surveyId2, user: user3 })
    const job4 = new Job('SurveyJob', { surveyId: surveyId1, user: user4 })
    const jobs = [job1, job2, job3, job4]

    // expecting job 3 to be executed before job 2 while job 1 is still running
    const expectedExecutedJobUuids = [job1.uuid, job3.uuid, job2.uuid, job4.uuid]

    await enqueueJobsAndExpectExecutionOrder({ jobs, expectedExecutedJobUuids })
  })

  test('global jobs executed before survey ones', async () => {
    const job1 = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })
    const job2 = new Job('SurveyJob', { surveyId: surveyId1, user: user2 })
    const job3 = new Job('SurveyJob', { surveyId: surveyId2, user: user2 })
    const job4 = new Job('GlobalJob', { user: user3 })
    const job5 = new Job('SurveyJob', { surveyId: surveyId2, user: user4 })
    const jobs = [job1, job2, job3, job4, job5]

    // All 5 jobs are enqueued synchronously, back-to-back, in the same tick. Since
    // job-start now requires an async cluster-wide DB check (task 4) before a job can
    // be promoted to "running", none of these 5 can be promoted synchronously within
    // its own enqueue() call anymore - by the time the first promotion decision is
    // actually made, all 5 are already sitting in the queue together, and
    // _findNextJobIndex's "global jobs run before survey ones" priority rule is
    // evaluated once, over the whole batch, rather than job-by-job as each one used to
    // be promoted immediately upon arrival. So job4 (global) now wins first pick
    // outright, ahead of even job1 - not because arrival order stopped mattering, but
    // because none of the 5 had a chance to be individually promoted before all 5
    // became visible together. This is an inherent consequence of the async check this
    // task adds, not a regression: the priority rule itself (global jobs preferred once
    // eligible) is unaffected, and still correctly applies once contention arises
    // between jobs that aren't all racing into the queue in the same synchronous tick.
    const expectedExecutedJobUuids = [job4.uuid, job1.uuid, job3.uuid, job2.uuid, job5.uuid]

    await enqueueJobsAndExpectExecutionOrder({ jobs, expectedExecutedJobUuids })
  })

  test('enqueue persists a job row for survey-scoped jobs', async () => {
    jobRepositoryInsertSpy.mockClear()
    const job = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })

    await enqueueJobs({ jobs: [job] })

    expect(jobRepositoryInsertSpy).toHaveBeenCalledWith({
      uuid: job.uuid,
      userUuid: user1.uuid,
      surveyId: surveyId1,
      type: 'SurveyJob',
    })
  })

  test('enqueue does not persist a job row for global (no-surveyId) jobs', async () => {
    jobRepositoryInsertSpy.mockClear()
    const job = new Job('GlobalJob', { user: user1 })

    await enqueueJobs({ jobs: [job] })

    expect(jobRepositoryInsertSpy).not.toHaveBeenCalled()
  })

  test('a job is failed fast when another dyno already has an active job for the same survey', async () => {
    getActiveBySurveyIdSpy.mockResolvedValueOnce({ uuid: 'other-dyno-job-uuid' })

    // Use a plain JobQueue (not TestJobQueue): we want the real _hasActiveJobElsewhere
    // check to prevent _executeJob from ever running, and assert via the
    // WebSocketServer.notifyUser spy that _failQueuedJob actually calls, rather than
    // relying on enqueueJobs's execution-only resolution path (which has no signal for
    // a job that fails before it ever starts).
    const queue = new JobQueue()
    const job = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })

    queue.enqueue(job)
    // enqueue() synchronously assigns queue._startNextJobChain via _startNextJob();
    // awaiting it here waits for the entire triggered traversal (including the
    // conflict-fail path) to finish.
    await queue._startNextJobChain

    expect(notifyUserSpy).toHaveBeenCalledWith(
      user1.uuid,
      expect.anything(),
      expect.objectContaining({ status: jobStatus.failed })
    )
    expect(updateStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: job.uuid,
        status: jobStatus.failed,
        props: expect.objectContaining({
          errors: expect.objectContaining({
            generic: expect.objectContaining({
              params: expect.objectContaining({ text: expect.stringContaining('already running') }),
            }),
          }),
        }),
      })
    )
  })

  test('a job cancelled while its cluster-wide check is in flight is not executed and does not block a different queued job', async () => {
    // Regression test for a race between cancelJobByUserUuid (which mutates the queue
    // directly, synchronously, outside _startNextJob's serialization chain) and
    // _startNextJobInternal's post-await splice: the index a job occupied before the
    // async _hasActiveJobElsewhere check can go stale if something else mutates the
    // queue while that check is in flight.
    let releaseCheck
    getActiveByUserUuidSpy.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseCheck = () => resolve(null)
        })
    )

    class NoOpExecuteJobQueue extends JobQueue {
      constructor() {
        super()
        this.executedUuids = []
      }

      _executeJob(jobInfo) {
        this.executedUuids.push(jobInfo.uuid)
      }
    }

    const queue = new NoOpExecuteJobQueue()
    const job1 = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })
    const job2 = new Job('SurveyJob', { surveyId: surveyId2, user: user2 })

    queue.enqueue(job1) // starts a traversal that will suspend on job1's delayed check
    queue.enqueue(job2) // queued behind, chained after job1's in-flight traversal

    // let the chain actually reach and suspend on the delayed getActiveByUserUuid call
    await new Promise((resolve) => setImmediate(resolve))

    // cancel job1 while its check is still pending - job1 is not yet "running" (the
    // check hasn't resolved), so this hits cancelJobByUserUuid's queue-splice branch
    await queue.cancelJobByUserUuid(user1.uuid)

    // now let job1's suspended check resolve, and let the traversal run to completion
    releaseCheck()
    await queue._startNextJobChain

    expect(queue.executedUuids).not.toContain(job1.uuid)
    expect(queue.executedUuids).toContain(job2.uuid)
  })
})
