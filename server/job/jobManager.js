const path = require('path')

const { jobThreadMessageTypes } = require('./jobUtils')
const ThreadsCache = require('../threads/threadsCache')
const ThreadManager = require('../threads/threadManager')

const WebSocket = require('../utils/webSocket')
const WebSocketEvents = require('../../common/webSocket/webSocketEvents')

// USER JOB WORKERS

const userJobThreads = new ThreadsCache()

const notifyJobUpdate = job => {
  const userId = job.userId

  WebSocket.notifyUser(userId, WebSocketEvents.jobUpdate, job)

  if (job.ended) {
    const thread = userJobThreads.getThread(userId)
    thread.terminate()
    userJobThreads.removeThread(userId)
  }
}

// ====== UPDATE

const cancelActiveJobByUserId = async (userId) => {
  const jobThread = userJobThreads.getThread(userId)
  if (jobThread) {
    jobThread.postMessage({ type: jobThreadMessageTypes.cancelJob })
  }
}

// ====== EXECUTE

const executeJobThread = (job) => {

  const thread = new ThreadManager(
    path.resolve(__dirname, 'jobThread.js'),
    { jobType: job.type, jobParams: job.params },
    async job => await notifyJobUpdate(job)
  )

  userJobThreads.putThread(job.userId, thread)
}

module.exports = {
  executeJobThread,

  cancelActiveJobByUserId,
}