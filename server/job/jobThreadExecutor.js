import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import { throttle } from '@core/functionsDefer'

import ThreadManager from '@server/threads/threadManager'
import ThreadsCache from '@server/threads/threadsCache'
import DelayedDeleteCache from '@server/utils/DelayedDeleteCache'

import { jobThreadMessageTypes } from './jobUtils'

const threadCleanupDelay = 1000 // 1 sec
const notificationThrottleLimit = 500

// keep active job summaries in a cache (used to get active job status)
// items deletion is delayed: it can happen that the status of the job is requested after the job has complete.
const activeJobSummariesByUserUuid = new DelayedDeleteCache({ deleteDelaySeconds: 30 })

// USER JOB WORKERS

const userJobThreads = new ThreadsCache()

const _notifyJobUpdate = (jobSerialized) => {
  const { userUuid } = jobSerialized

  activeJobSummariesByUserUuid.set(userUuid, jobSerialized)

  WebSocketServer.notifyUser(userUuid, WebSocketEvent.jobUpdate, jobSerialized)
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

export const cancelActiveJobByUserUuid = async (userUuid) => {
  const jobThread = userJobThreads.getThread(userUuid)
  if (!jobThread) {
    return
  }
  jobThread.postMessage({ type: jobThreadMessageTypes.cancelJob })
}

// ====== EXECUTE

export const executeJobThread = (job, onUpdate) => {
  const { type: jobType, params: jobParams, uuid: jobUuid } = job

  const thread = new ThreadManager('jobThread.js', { jobType, jobParams, jobUuid }, (job) => {
    throttle(_notifyJobUpdate, 'jobThread_' + jobUuid, notificationThrottleLimit)(job)
    onUpdate?.(job)
  })
  const { user } = jobParams
  const { uuid: userUuid } = user
  userJobThreads.putThread(userUuid, thread)
}
