import { JobRepository } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'
import { JobQueue } from './JobQueue'
import { jobRowToSummary } from './jobUtils'

const queue = new JobQueue({ concurrency: ProcessUtils.ENV.jobQueueConcurrency })

// ====== READ

export const getActiveJobSummary = async (userUuid) => {
  const jobRow = await JobRepository.getActiveByUserUuid(userUuid)
  if (jobRow) return jobRowToSummary(jobRow)
  // Not every job is persisted (global jobs aren't - see job-queue-persistence plan's Global Constraints),
  // and there's a brief window right after enqueue before the fire-and-forget insert lands - fall back to
  // this dyno's own local state, which is always correct for a job this dyno actually knows about.
  return queue.getRunningJobSummaryByUserUuid(userUuid)
}

export const getJobSummary = async (jobUuid) => {
  const jobRow = await JobRepository.getByUuid(jobUuid)
  if (jobRow) return jobRowToSummary(jobRow)
  return queue.getJobSummary(jobUuid)
}

// ====== UPDATE

export const cancelActiveJobByUserUuid = async (userUuid) => queue.cancelJobByUserUuid(userUuid)

// ====== EXECUTE

export const enqueueJob = (job) => {
  queue.enqueue(job)
  return job
}
