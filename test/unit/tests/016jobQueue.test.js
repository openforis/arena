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
    }, 100)
  }
}

describe('JobQueue test', () => {
  test('survey jobs executed sequentially', async () => {
    const executedJobUuids = []
    const user1 = { uuid: UUIDs.v4() }
    const user2 = { uuid: UUIDs.v4() }
    const user3 = { uuid: UUIDs.v4() }
    const user4 = { uuid: UUIDs.v4() }

    const surveyId1 = 1
    const surveyId2 = 2

    const job1 = { type: 'TestJob', params: { surveyId: surveyId1, user: user1 }, uuid: UUIDs.v4() }
    const job2 = { type: 'TestJob', params: { surveyId: surveyId1, user: user2 }, uuid: UUIDs.v4() }
    const job3 = { type: 'TestJob', params: { surveyId: surveyId2, user: user3 }, uuid: UUIDs.v4() }
    const job4 = { type: 'TestJob', params: { surveyId: surveyId1, user: user4 }, uuid: UUIDs.v4() }
    const jobs = [job1, job2, job3, job4]
    const expectedExecutedJobUuids = jobs.map((job) => job.uuid)

    await new Promise((resolve) => {
      const queue = new TestJobQueue((jobExecuted) => {
        executedJobUuids.push(jobExecuted.uuid)
        if (executedJobUuids.length === jobs.length) {
          resolve()
        }
      })
      jobs.forEach((job) => {
        queue.enqueue(job)
      })
    })
    expect(executedJobUuids).toEqual(expectedExecutedJobUuids)
  })
})
