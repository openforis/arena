import { JobRepository, WebSocketServer } from '@openforis/arena-server'

import Job from '../../../server/job/job'
import { startJobEnsuringEndNotification } from '../../../server/job/jobRunner'
import { createJobThreadListeners } from '../../../server/job/jobThreadExecutor'
import { jobStatus, jobToJSON } from '../../../server/job/jobUtils'

class SucceedingJob extends Job {
  constructor() {
    super('SucceedingJob')
  }
}

class FailingOnEndJob extends Job {
  constructor() {
    super('FailingOnEndJob')
  }

  async onEnd() {
    await super.onEnd()
    throw new Error('error deleting temp file')
  }
}

// simulates a failure happening before the job is set as running (e.g. the db transaction cannot be opened)
const failingClient = {
  tx: async () => {
    throw new Error('cannot connect to db')
  },
}

class FailingBeforeRunningJob extends Job {
  constructor() {
    super('FailingBeforeRunningJob')
  }

  async start() {
    return super.start(failingClient)
  }
}

// simulates the job thread: collects the job notifications sent to the parent thread
const runJob = async (job) => {
  const notifications = []
  const notifyJob = () => notifications.push(jobToJSON(job))
  job.onEvent(notifyJob)
  await startJobEnsuringEndNotification({
    job,
    isEndNotified: () => notifications.some((notification) => notification.ended),
    notifyJob,
  })
  return notifications
}

describe('Job end notification', () => {
  test('job succeeding notifies its end only once', async () => {
    const notifications = await runJob(new SucceedingJob())
    const endNotifications = notifications.filter((notification) => notification.ended)
    expect(endNotifications.length).toBe(1)
    expect(endNotifications[0].status).toBe(jobStatus.succeeded)
  })

  test('job throwing an error while ending is notified as ended', async () => {
    const notifications = await runJob(new FailingOnEndJob())
    const lastNotification = notifications.at(-1)
    expect(lastNotification.ended).toBe(true)
    expect(lastNotification.status).toBe(jobStatus.failed)
  })

  test('job failing before running is notified as failed', async () => {
    const notifications = await runJob(new FailingBeforeRunningJob())
    expect(notifications.length).toBe(1)
    const [notification] = notifications
    expect(notification.ended).toBe(true)
    expect(notification.status).toBe(jobStatus.failed)
    // the original error is swallowed by JobBase.start when the job is not running yet
    expect(JSON.stringify(notification.errors)).toContain('Job terminated unexpectedly')
  })
})

describe('Job thread listeners', () => {
  const spies = []

  beforeAll(() => {
    spies.push(
      jest.spyOn(JobRepository, 'updateProgress').mockResolvedValue(undefined),
      jest.spyOn(JobRepository, 'updateStatus').mockResolvedValue({}),
      jest.spyOn(WebSocketServer, 'notifyUser').mockImplementation(() => {})
    )
  })

  afterAll(async () => {
    // wait for throttled job notifications to be flushed before restoring the mocked functions
    await new Promise((resolve) => setTimeout(resolve, 600))
    spies.forEach((spy) => spy.mockRestore())
  })

  const createListeners = ({ jobUuid }) => {
    const updates = []
    const listeners = createJobThreadListeners({
      jobUuid,
      jobType: 'TestJob',
      userUuid: 'user-1',
      surveyId: 1,
      onUpdate: (job) => updates.push(job),
    })
    return { ...listeners, updates }
  }

  test('thread exiting before the job ends notifies the job as failed', () => {
    const { onJobUpdate, onThreadExit, updates } = createListeners({ jobUuid: 'job-exit-1' })
    onJobUpdate({ uuid: 'job-exit-1', userUuid: 'user-1', status: jobStatus.running, ended: false })
    onThreadExit()

    expect(updates.length).toBe(2)
    const lastUpdate = updates.at(-1)
    expect(lastUpdate.uuid).toBe('job-exit-1')
    expect(lastUpdate.ended).toBe(true)
    expect(lastUpdate.status).toBe(jobStatus.failed)
  })

  test('thread exiting after the job ended does not notify anything else', () => {
    const { onJobUpdate, onThreadExit, updates } = createListeners({ jobUuid: 'job-exit-2' })
    onJobUpdate({ uuid: 'job-exit-2', userUuid: 'user-1', status: jobStatus.succeeded, ended: true })
    onJobUpdate({ uuid: 'job-exit-2', userUuid: 'user-1', status: jobStatus.succeeded, ended: true })
    onThreadExit()

    expect(updates.length).toBe(1)
    expect(updates[0].status).toBe(jobStatus.succeeded)
  })
})
