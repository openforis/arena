import { QueueEvents } from 'bullmq'

import { WebSocketServer } from '@openforis/arena-server'

const jobUpdateEvent = 'jobQueue/jobUpdate'

export const notifyUser = async ({ jobUuid, status, jobQueue }) => {
  const userUuid = jobQueue.getUserUuidByJobUuid(jobUuid)
  const job = await jobQueue.getJobSummary({ jobUuid })
  WebSocketServer.notifyUser(userUuid, jobUpdateEvent, { ...job, queueStatus: status })
}

export const initJobQueueEvents = ({ queueName, connection, jobQueue }) => {
  const queueEvents = new QueueEvents(queueName, { connection })

  const events = ['waiting', 'active', 'completed', 'failed']
  events.forEach((event) => {
    queueEvents.on(event, ({ jobId }) => {
      console.log('-=== job event', event, jobId)
      notifyUser({ jobUuid: jobId, status: event, jobQueue })
    })
  })
}
