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

  test('a job for the same survey is promoted, not failed, when the DB still shows the just-ended local job as active (throttle lag)', async () => {
    // Regression test for _hasActiveJobElsewhere treating a global DB query as truly
    // "elsewhere": onJobEnd() frees local locks synchronously the instant a job's thread
    // posts its terminal update, but the DB write for that same terminal status goes
    // through a 500ms per-job throttle (core/functionsDefer's throttle(), used in
    // jobThreadExecutor.js), so there's a real window where a job has locally ended but
    // its DB row still says 'running'. A same-dyno successor job for the same survey
    // must not be failed for a conflict that already resolved on this exact dyno.
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
    const job2 = new Job('SurveyJob', { surveyId: surveyId1, user: user2 })

    queue.enqueue(job1)
    await queue._startNextJobChain // job1 now running

    queue.enqueue(job2)
    await queue._startNextJobChain // job2 queued, blocked by survey1 (job1 still running)

    // simulate the DB's terminal-status write for job1 still lagging behind (throttled):
    // the row job2's cluster-wide check finds is job1's own, still-stale-'running' row
    getActiveBySurveyIdSpy.mockResolvedValueOnce({ uuid: job1.uuid })

    // job1 ends locally (this is what the real worker thread triggers via onJobUpdate)
    queue.onJobEnd({ uuid: job1.uuid })
    await queue._startNextJobChain

    // job2 must have been promoted and actually executed, not failed as a false conflict
    expect(queue.executedUuids).toContain(job2.uuid)
    expect(notifyUserSpy).not.toHaveBeenCalledWith(
      user2.uuid,
      expect.anything(),
      expect.objectContaining({ status: jobStatus.failed })
    )
  })

  test('a user with two outstanding jobs (different surveys) does not lose track of either when acting on one', async () => {
    // Regression test for _jobUuidByUserUuid being single-valued: enqueue() used to
    // overwrite a user's single map entry on every enqueue, and onJobEnd/_failQueuedJob/
    // cancelJobByUserUuid unconditionally worked off that single entry - so once a user
    // has two concurrently outstanding jobs (allowed for different surveys), acting on
    // one (ending it, cancelling it) could wipe out or misidentify the bookkeeping for
    // the other, making it invisible to cancelJobByUserUuid/getRunningJobSummaryByUserUuid
    // even though it's still very much outstanding.
    // Note: JobThreadExecutor.cancelActiveJobByUserUuid is deliberately left unmocked
    // here (rather than jest.spyOn, which fails with "Cannot redefine property" against
    // this repo's bundled webpack/babel ESM export interop) - it's a safe no-op in this
    // test since NoOpExecuteJobQueue never registers a real thread for it to find.
    class NoOpExecuteJobQueue extends JobQueue {
      _executeJob() {
        // no-op: don't spawn a real thread
      }
    }

    const queue = new NoOpExecuteJobQueue()
    const jobA = new Job('SurveyJob', { surveyId: surveyId1, user: user1 })
    const jobB = new Job('SurveyJob', { surveyId: surveyId2, user: user1 })

    queue.enqueue(jobA)
    await queue._startNextJobChain // jobA now running

    queue.enqueue(jobB)
    await queue._startNextJobChain // jobB queued (different survey; blocked from running by
    // the local per-user guard while jobA is running, but still outstanding)

    // both jobs should be tracked as outstanding for user1
    expect(queue._jobUuidsByUserUuid[user1.uuid].has(jobA.uuid)).toBe(true)
    expect(queue._jobUuidsByUserUuid[user1.uuid].has(jobB.uuid)).toBe(true)
    expect(queue._queue.some((jobInfo) => jobInfo.uuid === jobB.uuid)).toBe(true)

    // cancelling this user's jobs must correctly remove the QUEUED one (jobB) from the
    // queue - with the old single-valued-map bug this would either silently no-op (if
    // the single slot had already been overwritten/cleared) or evict the wrong job
    await queue.cancelJobByUserUuid(user1.uuid)

    expect(queue._queue.some((jobInfo) => jobInfo.uuid === jobB.uuid)).toBe(false)
    expect(queue._jobUuidsByUserUuid[user1.uuid].has(jobB.uuid)).toBe(false)
    // jobA (running) is untouched by this call itself - its own cleanup happens later,
    // via onJobEnd, once its thread acknowledges the cancellation - but it must still be
    // tracked, not accidentally swept away by jobB's cancellation
    expect(queue._jobUuidsByUserUuid[user1.uuid].has(jobA.uuid)).toBe(true)

    // simulate jobA's thread eventually acknowledging its cancellation
    queue.onJobEnd({ uuid: jobA.uuid })
    await queue._startNextJobChain

    // once jobA is fully gone too, the user's bookkeeping should be cleared entirely (not
    // left holding a stale/orphaned entry from either job)
    expect(queue._jobUuidsByUserUuid[user1.uuid]).toBeUndefined()
  })
})
