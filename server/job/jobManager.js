import * as JobQueue from './jobQueue'

export const getActiveJobSummary = JobQueue.getActiveJobByUserUuid

export const cancelActiveJobByUserUuid = JobQueue.cancelActiveJobByUserUuid

export const enqueueJob = async (jobInfo) => {
  await JobQueue.enqueue(jobInfo)
  return jobInfo
}
