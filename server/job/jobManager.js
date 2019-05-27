const path = require('path')

const logger = require('../log/log').getLogger('JobManager')

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
    //delay thread termination by 1 second (give time to print debug info to the console)
    setTimeout(() => {
        thread.terminate()
        userJobThreads.removeThread(userId)
      },
      1000
    )
  }
}

// ====== UPDATE

const cancelActiveJobByUserId = async userId => {
  const jobThread = userJobThreads.getThread(userId)
  if (jobThread) {
    jobThread.postMessage({ type: jobThreadMessageTypes.cancelJob })
  }
}

// ====== EXECUTE

const executeJobThread = job => {

  const thread = new ThreadManager(
    path.resolve(__dirname, 'jobThread.js'),
    { jobType: job.type, jobParams: job.params },
    async job => await notifyJobUpdate(job)
  )

  userJobThreads.putThread(job.getUserId(), thread)
}

module.exports = {
  executeJobThread,

  cancelActiveJobByUserId,
}