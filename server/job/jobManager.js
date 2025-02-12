import * as JobQueue from './jobQueue'
import * as JobThreadExecutor from './jobThreadExecutor'

export const getActiveJobSummary = JobQueue.getActiveJobByUserUuid

export const cancelActiveJobByUserUuid = JobQueue.cancelActiveJobByUserUuid

export const enqueueJob = async (job) => {
  if (JobQueue.enabled) {
    await JobQueue.enqueue(job)
  } else {
    JobThreadExecutor.executeJobThread(job)
  }
  return job
}
