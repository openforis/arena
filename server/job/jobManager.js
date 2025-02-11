import * as JobQueue from './jobQueue'

export const getActiveJobSummary = JobQueue.getActiveJobByUserUuid

export const cancelActiveJobByUserUuid = JobQueue.cancelActiveJobByUserUuid

export const enqueueJob = (jobInfo) => {
  JobQueue.enqueue(jobInfo).catch(() => {
    // ignore it
  })
}
