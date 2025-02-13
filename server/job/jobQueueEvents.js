import { QueueEvents } from 'bullmq'

import { WebSocketServer } from '@openforis/arena-server'

const jobUpdateEvent = 'jobQueue/jobUpdate'

export const initJobQueueEvents = ({ queueName, connection, getUserUuidByJobUuid, getJobSummary }) => {
  const queueEvents = new QueueEvents(queueName, { connection })

  const notifyUser = async ({ jobId, status }) => {
    const userUuid = getUserUuidByJobUuid(jobId)
    const job = await getJobSummary({ jobUuid: jobId })
    WebSocketServer.notifyUser(userUuid, jobUpdateEvent, { ...job, queueStatus: status })
  }

  const events = ['waiting', 'active', 'completed', 'failed']
  events.forEach((event) => {
    queueEvents.on(event, ({ jobId }) => {
      notifyUser({ jobId, status: event })
    })
  })
}
