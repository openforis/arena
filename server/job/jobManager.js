import * as ProcessUtils from '@core/processUtils'
import { JobQueue } from './JobQueue'

const queue = new JobQueue({ concurrency: ProcessUtils.ENV.jobQueueConcurrency })

// ====== READ

export const getActiveJobSummary = (userUuid) => queue.getRunningJobSummaryByUserUuid(userUuid)

export const getJobSummary = (jobUuid) => queue.getJobSummary(jobUuid)

// ====== UPDATE

export const cancelActiveJobByUserUuid = async (userUuid) => queue.cancelJobByUserUuid(userUuid)

// ====== EXECUTE

export const enqueueJob = (job) => {
  queue.enqueue(job)
  return job
}
