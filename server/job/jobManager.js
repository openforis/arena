import { JobRepository } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'
import * as Log from '@server/log/log'

import { JobQueue } from './JobQueue'
import { jobRowToSummary, jobRowToMonitorSummary } from './jobUtils'
import * as jobRepository from './jobRepository'

const logger = Log.getLogger('JobManager')

const queue = new JobQueue({ concurrency: ProcessUtils.ENV.jobQueueConcurrency })

// ====== READ

export const getActiveJobSummary = async (userUuid) => {
  // Check local state first: this dyno's own in-memory state is always more current than the DB
  // for a job it actually knows about - no post-enqueue race window (the DB insert might not have
  // landed yet), and no loss of composite-job detail (jobRowToSummary can't reconstruct
  // innerJobs/currentInnerJobIndex, so a DB-first read degrades progress detail for the very dyno
  // that's actually running the job). Fall back to the DB only when this dyno doesn't know about
  // the job at all (e.g. it's running on a different dyno, or this dyno restarted).
  const localSummary = queue.getRunningJobSummaryByUserUuid(userUuid)
  if (localSummary) return localSummary

  try {
    const jobRow = await JobRepository.getActiveByUserUuid(userUuid)
    return jobRow ? jobRowToSummary(jobRow) : null
  } catch (error) {
    logger.error(`error reading active job summary from DB: ${error}`)
    return null
  }
}

export const getJobSummary = async (jobUuid) => {
  const localSummary = queue.getJobSummary(jobUuid)
  if (localSummary) return localSummary

  try {
    const jobRow = await JobRepository.getByUuid(jobUuid)
    return jobRow ? jobRowToSummary(jobRow) : null
  } catch (error) {
    logger.error(`error reading job summary from DB: ${error}`)
    return null
  }
}

export const getAllJobsSummary = async () => {
  const rows = await jobRepository.getAll()
  return rows.map(jobRowToMonitorSummary)
}

// ====== UPDATE

export const cancelActiveJobByUserUuid = async (userUuid) => queue.cancelJobByUserUuid(userUuid)

export const cancelJobByUuid = async (jobUuid) => queue.cancelJobByUuid(jobUuid, { canceledByAdmin: true })

// ====== EXECUTE

export const enqueueJob = (job) => {
  queue.enqueue(job)
  return job
}
