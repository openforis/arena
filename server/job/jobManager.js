import * as JobQueue from './jobQueue'

export const getActiveJobSummary = JobQueue.getActiveJobByUserUuid

export const cancelActiveJobByUserUuid = JobQueue.cancelActiveJobByUserUuid

export const enqueueJob = async (job) => {
  await JobQueue.enqueue(job)
  return job
}
