import { JobRepository, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import { throttle } from '@core/functionsDefer'

import ThreadManager from '@server/threads/threadManager'
import ThreadsCache from '@server/threads/threadsCache'
import DelayedDeleteCache from '@server/utils/DelayedDeleteCache'
import * as Log from '@server/log/log'

import { jobRowToSummary, jobStatus, jobThreadMessageTypes } from './jobUtils'

const logger = Log.getLogger('JobThreadExecutor')

const threadCleanupDelay = 1000 // 1 sec
const notificationThrottleLimit = 500

// keep active job summaries in a cache (used to get active job status)
// items deletion is delayed: it can happen that the status of the job is requested after the job has complete.
const activeJobSummariesByUserUuid = new DelayedDeleteCache({ deleteDelaySeconds: 30 })

// USER JOB WORKERS

const userJobThreads = new ThreadsCache()

const _persistJobUpdate = async (jobSerialized) => {
  const { uuid, status, processed, total, result, errors, ended } = jobSerialized

  try {
    await JobRepository.updateProgress({ uuid, processed, total })
    await JobRepository.updateStatus(ended ? { uuid, status, props: { result, errors } } : { uuid, status })
  } catch (error) {
    logger.error(`error persisting job update for job ${uuid}: ${error}`)
  }
}

export const _notifyJobUpdateForTest = _persistJobUpdate

const _notifyJobUpdate = (jobSerialized) => {
  const { userUuid } = jobSerialized

  activeJobSummariesByUserUuid.set(userUuid, jobSerialized)

  WebSocketServer.notifyUser(userUuid, WebSocketEvent.jobUpdate, jobSerialized)
  _persistJobUpdate(jobSerialized).catch((error) => logger.error(`error persisting job update: ${error}`))

  if (!jobSerialized.ended) {
    return
  }

  const jobThread = userJobThreads.getThread(userUuid)
  if (!jobThread) {
    return
  }

  // Delay thread termination by 1 second (give time to print debug info to the console)
  setTimeout(() => {
    jobThread.terminate()
    userJobThreads.removeThread(userUuid)
  }, threadCleanupDelay)

  activeJobSummariesByUserUuid.delete(userUuid)
}

// ====== READ

export const getActiveJobSummary = (userUuid) => activeJobSummariesByUserUuid.get(userUuid)

// ====== UPDATE

export const cancelActiveJobByUserUuid = async (userUuid, { canceledByAdmin = false } = {}) => {
  const jobThread = userJobThreads.getThread(userUuid)
  if (!jobThread) {
    return
  }
  jobThread.postMessage({ type: jobThreadMessageTypes.cancelJob, canceledByAdmin })
}

// ====== EXECUTE

const _createFailedJobSummary = ({ jobUuid, jobType, userUuid, surveyId, dateCreated }) =>
  jobRowToSummary({
    uuid: jobUuid,
    userUuid,
    surveyId,
    type: jobType,
    status: jobStatus.failed,
    processed: 0,
    total: 0,
    props: {
      errors: { generic: { key: 'appErrors:generic', params: { text: 'Job execution terminated unexpectedly' } } },
    },
    dateCreated,
    dateModified: new Date(),
  })

/**
 * Creates the listeners of a job thread messages and termination.
 * The job is always notified as ended to the listener, even when the thread terminates (e.g. it crashes) without notifying it:
 * otherwise the job queue would consider the job still active, preventing the user from running other jobs.
 * @param {!object} params - The parameters.
 * @param {!string} params.jobUuid - The UUID of the job.
 * @param {!string} params.jobType - The type of the job.
 * @param {!string} params.userUuid - The UUID of the user running the job.
 * @param {number} [params.surveyId] - The ID of the survey the job is running on (if any).
 * @param {function(object): void} [params.onUpdate] - Function invoked on every job update (until the job ends).
 * @returns {{onJobUpdate: function(object): void, onThreadExit: function(): void}} - The thread message and exit listeners.
 */
export const createJobThreadListeners = ({ jobUuid, jobType, userUuid, surveyId, onUpdate }) => {
  const dateCreated = new Date()
  let ended = false

  const onJobUpdate = (jobSerialized) => {
    if (ended) {
      // the job queue has already released this job: ignore late updates
      return
    }
    ended = Boolean(jobSerialized.ended)
    throttle(_notifyJobUpdate, 'jobThread_' + jobUuid, notificationThrottleLimit)(jobSerialized)
    onUpdate?.(jobSerialized)
  }

  const onThreadExit = () => {
    if (ended) return
    logger.error(`thread of job ${jobType} (${jobUuid}) exited before the job ended; marking the job as failed`)
    onJobUpdate(_createFailedJobSummary({ jobUuid, jobType, userUuid, surveyId, dateCreated }))
  }

  return { onJobUpdate, onThreadExit }
}

export const executeJobThread = (job, onUpdate) => {
  const { type: jobType, params: jobParams, uuid: jobUuid } = job
  const { user, surveyId } = jobParams
  const { uuid: userUuid } = user

  const { onJobUpdate, onThreadExit } = createJobThreadListeners({ jobUuid, jobType, userUuid, surveyId, onUpdate })

  const thread = new ThreadManager('jobThread.js', { jobType, jobParams, jobUuid }, onJobUpdate, onThreadExit)
  userJobThreads.putThread(userUuid, thread)
}
