import * as JobManager from '@server/job/jobManager'

import MessageSendJob from './MessageSendJob'

const startMessageSendJob = ({ user, messageUuid }) => {
  const job = new MessageSendJob({ user, messageUuid })
  return JobManager.enqueueJob(job)
}

export const MessageService = {
  startMessageSendJob,
}
