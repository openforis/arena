import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import ThreadsCache from '@server/threads/threadsCache'
import ThreadManager from '@server/threads/threadManager'
import DelayedDeleteCache from '@server/utils/DelayedDeleteCache'

import { jobThreadMessageTypes } from './jobUtils'

const threadCleanupDelay = 1000 // 1 sec

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

export const executeJobThread = (job) => {
  const { type: jobType, params: jobParams } = job

  const thread = new ThreadManager('jobThread.js', { jobType, jobParams }, (job) => _notifyJobUpdate(job))

  userJobThreads.putThread(job.userUuid, thread)
}
