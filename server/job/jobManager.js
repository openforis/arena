import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import ThreadsCache from '@server/threads/threadsCache'
import ThreadManager from '@server/threads/threadManager'

import { jobThreadMessageTypes } from './jobUtils'

// USER JOB WORKERS

const userJobThreads = new ThreadsCache()

const _notifyJobUpdate = (jobSerialized) => {
  const { userUuid } = jobSerialized

  WebSocketServer.notifyUser(userUuid, WebSocketEvent.jobUpdate, jobSerialized)
  if (!jobSerialized.ended) {
    return
  }

  const jobThread = userJobThreads.getThread(userUuid)
  if (!jobThread) {
    return
  }

  const cleanupThread = () => {
    jobThread.terminate()
    userJobThreads.removeThread(userUuid)
  }

  // Delay thread termination by 1 second (give time to print debug info to the console)
  setTimeout(cleanupThread, 1000)
}

// ====== READ

export const getActiveJobSummary = (userUuid) => {
  const jobThread = userJobThreads.getThread(userUuid)
  return jobThread?.jobSummary
}

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
