import { UUIDs } from '@openforis/arena-core'
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

const runDelayed = (func) => {
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

describe('JobQueue test', () => {
  test('user can enqueue only one job', async () => {
    const user1 = { uuid: UUIDs.v4() }

    const surveyId1 = 1

    const job1 = { type: 'SurveyJob', params: { surveyId: surveyId1, user: user1 }, uuid: UUIDs.v4() }
    const job2 = { type: 'SurveyJob', params: { surveyId: surveyId1, user: user1 }, uuid: UUIDs.v4() }

    await expect(enqueueJobs({ jobs: [job1, job2] })).rejects.toThrow()
  })

  test('survey jobs executed sequentially', async () => {
    const user1 = { uuid: UUIDs.v4() }
    const user2 = { uuid: UUIDs.v4() }
    const user3 = { uuid: UUIDs.v4() }
    const user4 = { uuid: UUIDs.v4() }

    const surveyId1 = 1
    const surveyId2 = 2

    const job1 = { type: 'SurveyJob', params: { surveyId: surveyId1, user: user1 }, uuid: UUIDs.v4() }
    const job2 = { type: 'SurveyJob', params: { surveyId: surveyId1, user: user2 }, uuid: UUIDs.v4() }
    const job3 = { type: 'SurveyJob', params: { surveyId: surveyId2, user: user3 }, uuid: UUIDs.v4() }
    const job4 = { type: 'SurveyJob', params: { surveyId: surveyId1, user: user4 }, uuid: UUIDs.v4() }
    const jobs = [job1, job2, job3, job4]

    // expecting job 3 to be executed before job 2 while job 1 is still running
    const expectedExecutedJobUuids = [job1.uuid, job3.uuid, job2.uuid, job4.uuid]

    await enqueueJobsAndExpectExecutionOrder({ jobs, expectedExecutedJobUuids })
  })

  test('global jobs executed before survey ones', async () => {
    const user1 = { uuid: UUIDs.v4() }
    const user2 = { uuid: UUIDs.v4() }
    const user3 = { uuid: UUIDs.v4() }
    const user4 = { uuid: UUIDs.v4() }

    const surveyId1 = 1
    const surveyId2 = 2

    const job1 = { type: 'SurveyJob', params: { surveyId: surveyId1, user: user1 }, uuid: UUIDs.v4() }
    const job2 = { type: 'SurveyJob', params: { surveyId: surveyId1, user: user2 }, uuid: UUIDs.v4() }
    const job3 = { type: 'SurveyJob', params: { surveyId: surveyId2, user: user2 }, uuid: UUIDs.v4() }
    const job4 = { type: 'GlobalJob', params: { user: user3 }, uuid: UUIDs.v4() }
    const job5 = { type: 'SurveyJob', params: { surveyId: surveyId2, user: user4 }, uuid: UUIDs.v4() }
    const jobs = [job1, job2, job3, job4, job5]

    // expecting job 4 (global) to run before the other (except the first)
    const expectedExecutedJobUuids = [job1.uuid, job3.uuid, job4.uuid, job2.uuid, job5.uuid]

    await enqueueJobsAndExpectExecutionOrder({ jobs, expectedExecutedJobUuids })
  })
})
