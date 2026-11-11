import { ClusterBus, JobRepository } from '@openforis/arena-server'

import * as ProcessUtils from '@core/processUtils'
import { uuidv4 } from '@core/uuid'
import * as Log from '@server/log/log'

import { JobQueue } from './JobQueue'
import { jobRowToSummary, jobRowToMonitorSummary } from './jobUtils'
import * as jobRepository from './jobRepository'

const logger = Log.getLogger('JobManager')

const queue = new JobQueue({ concurrency: ProcessUtils.ENV.jobQueueConcurrency })

// ====== CLUSTER
// a job can run on another server process: cancel requests are relayed to all of them

const processId = uuidv4()
const clusterEventTargetType = 'jobQueue'
const clusterEventTypes = { cancelByUserUuid: 'cancelByUserUuid', cancelByJobUuid: 'cancelByJobUuid' }

const handleClusterEvent = (event) => {
  const { targetType, eventType, message } = event
  // events are delivered to the publishing process too: it has already canceled its own jobs
  if (targetType !== clusterEventTargetType || message?.originProcessId === processId) return

  const cancelPromise =
    eventType === clusterEventTypes.cancelByUserUuid
      ? queue.cancelJobByUserUuid(message.userUuid)
      : queue.cancelJobByUuid(message.jobUuid, { canceledByAdmin: message.canceledByAdmin })
  cancelPromise.catch((error) => logger.error(`error canceling job from cluster event: ${error}`))
}

// Exported under a test-only name so tests can invoke it directly
export const _handleClusterEventForTest = handleClusterEvent

ClusterBus.onEvent(handleClusterEvent)

const publishCancelEvent = ({ eventType, targetId, message }) =>
  ClusterBus.publish({
    targetType: clusterEventTargetType,
    targetId,
    eventType,
    message: { ...message, originProcessId: processId },
  }).catch((error) => logger.error(`error publishing ${eventType} cluster event: ${error}`))

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

export const cancelActiveJobByUserUuid = async (userUuid) => {
  await queue.cancelJobByUserUuid(userUuid)
  await publishCancelEvent({
    eventType: clusterEventTypes.cancelByUserUuid,
    targetId: userUuid,
    message: { userUuid },
  })
}

export const cancelJobByUuid = async (jobUuid) => {
  const canceledByAdmin = true
  await queue.cancelJobByUuid(jobUuid, { canceledByAdmin })
  await publishCancelEvent({
    eventType: clusterEventTypes.cancelByJobUuid,
    targetId: jobUuid,
    message: { jobUuid, canceledByAdmin },
  })
}

// ====== EXECUTE

export const enqueueJob = (job) => {
  queue.enqueue(job)
  return job
}
