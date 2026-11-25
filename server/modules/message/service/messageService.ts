import type { ArenaUser } from '@openforis/arena-core'

import * as JobManager from '@server/job/jobManager'

import MessageSendJob from './messageSendJob'

const startMessageSendJob = ({ user, messageUuid }: { user: ArenaUser; messageUuid: string }) => {
  const job = new MessageSendJob({ user, messageUuid })
  return JobManager.enqueueJob(job)
}

export const MessageService = {
  startMessageSendJob,
}
