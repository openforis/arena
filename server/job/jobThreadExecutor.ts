import { JobRepository, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import { throttle } from '@core/functionsDefer'
import * as Log from '@server/log/log'
import ThreadManager from '@server/threads/threadManager'
import ThreadsCache from '@server/threads/threadsCache'
import DelayedDeleteCache from '@server/utils/delayedDeleteCache'

import * as LocalJobRepository from './jobRepository'
import { jobRowToSummary, jobStatus, jobThreadMessageTypes } from './jobUtils'

type JobSerialized = Record<string, any>
type JobUpdateListener = (jobSerialized: JobSerialized) => void

const logger = Log.getLogger('JobThreadExecutor')

const threadCleanupDelay = 1000 // 1 sec
const notificationThrottleLimit = 500
// jobs update their row only when they report progress: a long step without progress must not look stale
const heartbeatInterval = 5 * 60 * 1000 // 5 mins

// keep active job summaries in a cache (used to get active job status)
// items deletion is delayed: it can happen that the status of the job is requested after the job has complete.
const activeJobSummariesByUserUuid = new DelayedDeleteCache({ deleteDelaySeconds: 30 })

// USER JOB WORKERS

const userJobThreads = new ThreadsCache<ThreadManager>()
const jobThreadsByJobUuid = new ThreadsCache<ThreadManager>()

const _touchRunningJobs = async () => {
  const uuids = jobThreadsByJobUuid.findThreadsKeys(() => true)
  try {
    await LocalJobRepository.touchActiveJobs({ uuids })
  } catch (error) {
    logger.error(`error touching running jobs: ${error}`)
  }
}

// heartbeat timer must not keep the process alive (e.g. at the end of the tests)
setInterval(_touchRunningJobs, heartbeatInterval).unref?.()

const _persistJobUpdate = async (jobSerialized: JobSerialized): Promise<void> => {
  const { uuid, status, processed, total, result, errors, ended } = jobSerialized

  try {
    await JobRepository.updateProgress({ uuid, processed, total })
    await JobRepository.updateStatus(ended ? { uuid, status, props: { result, errors } } : { uuid, status })
  } catch (error) {
    logger.error(`error persisting job update for job ${uuid}: ${error}`)
  }
}

export const _notifyJobUpdateForTest = _persistJobUpdate

const _notifyJobUpdate = (jobSerialized: JobSerialized): void => {
  const { userUuid, uuid: jobUuid } = jobSerialized

  const jobThread = jobThreadsByJobUuid.getThread(jobUuid)
  // the notification is throttled: a newer job of the same user can be already running
  const isUserCurrentJob = !jobThread || userJobThreads.getThread(userUuid) === jobThread

  if (isUserCurrentJob) {
    activeJobSummariesByUserUuid.set(userUuid, jobSerialized)
  }
  WebSocketServer.notifyUser(userUuid, WebSocketEvent.jobUpdate, jobSerialized)
  _persistJobUpdate(jobSerialized).catch((error) => logger.error(`error persisting job update: ${error}`))

  if (!jobSerialized.ended) {
    return
  }
  if (isUserCurrentJob) {
    activeJobSummariesByUserUuid.delete(userUuid)
  }
  if (!jobThread) {
    return
  }
  jobThreadsByJobUuid.removeThread(jobUuid)
  if (isUserCurrentJob) {
    userJobThreads.removeThread(userUuid)
  }
  // Delay thread termination by 1 second (give time to print debug info to the console)
  setTimeout(() => jobThread.terminate(), threadCleanupDelay)
}

// ====== READ

export const getActiveJobSummary = (userUuid: string) => activeJobSummariesByUserUuid.get(userUuid)

// ====== UPDATE

export const cancelActiveJobByUserUuid = (
  userUuid: string,
  { canceledByAdmin = false }: { canceledByAdmin?: boolean } = {}
): void => {
  const jobThread = userJobThreads.getThread(userUuid)
  if (!jobThread) {
    return
  }
  jobThread.postMessage({ type: jobThreadMessageTypes.cancelJob, canceledByAdmin })
}

// ====== EXECUTE

const _createFailedJobSummary = ({
  jobUuid,
  jobType,
  userUuid,
  surveyId,
  dateCreated,
  processed,
  total,
}: {
  jobUuid: string
  jobType: string
  userUuid: string
  surveyId?: number | null
  dateCreated: Date
  processed: number
  total: number
}) =>
  jobRowToSummary({
    uuid: jobUuid,
    userUuid,
    surveyId,
    type: jobType,
    status: jobStatus.failed,
    processed,
    total,
    props: {
      errors: { generic: { key: 'appErrors:generic', params: { text: 'Job execution terminated unexpectedly' } } },
    },
    dateCreated,
    dateModified: new Date(),
  })

/**
 * Creates the listeners of a job thread messages and termination (onUpdate is invoked on every job update, until it ends).
 * The job is always notified as ended to the listener, even when the thread terminates (e.g. it crashes) without notifying it:
 * otherwise the job queue would consider the job still active, preventing the user from running other jobs.
 */
export const createJobThreadListeners = ({
  jobUuid,
  jobType,
  userUuid,
  surveyId,
  onUpdate,
}: {
  jobUuid: string
  jobType: string
  userUuid: string
  surveyId?: number | null
  onUpdate?: JobUpdateListener
}): { onJobUpdate: JobUpdateListener; onThreadExit: () => void } => {
  const dateCreated = new Date()
  let ended = false
  // last known progress, kept when the job is marked as failed because its thread exited unexpectedly
  let processed = 0
  let total = 0

  const onJobUpdate = (jobSerialized: JobSerialized): void => {
    if (ended) {
      // the job queue has already released this job: ignore late updates
      return
    }
    ended = Boolean(jobSerialized.ended)
    processed = jobSerialized.processed ?? processed
    total = jobSerialized.total ?? total
    throttle(_notifyJobUpdate, 'jobThread_' + jobUuid, notificationThrottleLimit)(jobSerialized)
    onUpdate?.(jobSerialized)
  }

  const onThreadExit = () => {
    if (ended) return
    logger.error(`thread of job ${jobType} (${jobUuid}) exited before the job ended; marking the job as failed`)
    onJobUpdate(_createFailedJobSummary({ jobUuid, jobType, userUuid, surveyId, dateCreated, processed, total }))
  }

  return { onJobUpdate, onThreadExit }
}

// a job or the job info kept in the job queue
type JobToExecute = { type: string; params: Record<string, any>; uuid: string }

export const executeJobThread = (job: JobToExecute, onUpdate?: JobUpdateListener): void => {
  const { type: jobType, params: jobParams, uuid: jobUuid } = job
  const { user, surveyId } = jobParams
  const { uuid: userUuid } = user

  const { onJobUpdate, onThreadExit } = createJobThreadListeners({ jobUuid, jobType, userUuid, surveyId, onUpdate })

  const thread = new ThreadManager('jobThread.js', { jobType, jobParams, jobUuid }, onJobUpdate, onThreadExit)
  userJobThreads.putThread(userUuid, thread)
  jobThreadsByJobUuid.putThread(jobUuid, thread)
}
