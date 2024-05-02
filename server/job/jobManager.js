import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import ThreadsCache from '@server/threads/threadsCache'
import ThreadManager from '@server/threads/threadManager'

import { jobThreadMessageTypes } from './jobUtils'

const threadCleanupDelay = 20000

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

  // Delay thread termination by 20 seconds (give time to print debug info to the console)
  setTimeout(cleanupThread, threadCleanupDelay)
}

// ====== READ

export const getActiveJobSummary = async (userUuid) => {
  const jobThread = userJobThreads.getThread(userUuid)
  if (!jobThread) return null

  // post a message to the thread and read the response using a listener
  return new Promise((resolve) => {
    const messageListener = ({ msg: jobSummary }) => {
      jobThread.removeMessageListener(messageListener)
      resolve(jobSummary)
    }
    jobThread.addMessageListener(messageListener)
    jobThread.postMessage({ type: jobThreadMessageTypes.fetchJob })
  })
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
