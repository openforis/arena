const path = require('path')

const {jobEvents} = require('../../common/webSocket/webSocketEvents')

const {jobThreadMessageTypes} = require('./jobUtils')
const ThreadsCache = require('../threads/threadsCache')
const Thread = require('../threads/thread')
const WebSocketManager = require('../webSocket/webSocketManager')

// USER JOB WORKERS

const userJobThreads = new ThreadsCache()

const notifyJobUpdate = job => {
  const userId = job.userId

  WebSocketManager.notifyUser(userId, jobEvents.update, job)

  if (job.ended) {
    userJobThreads.removeThread(userId)
  }
}

// ====== UPDATE

const cancelActiveJobByUserId = async (userId) => {
  const jobThread = userJobThreads.getThread(userId)
  if (jobThread) {
    jobThread.postMessage({type: jobThreadMessageTypes.cancelJob})
  }
}

// ====== EXECUTE

const executeJobThread = (job) => {

  const thread = new Thread(
    path.resolve(__dirname, 'jobThread.js'),
    {jobType: job.type, params: job.params},
    async job => await notifyJobUpdate(job)
  )

  userJobThreads.putThread(job.params.userId, thread)
}

module.exports = {
  executeJobThread,

  cancelActiveJobByUserId,
}