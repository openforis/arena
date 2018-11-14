const path = require('path')
const {Worker} = require('worker_threads')

const {throttle} = require('../../common/functionsDefer')

const jobSocketEvents = require('../../common/job/jobSocketEvents')

const userSockets = {}
const userJobs = {}

/**
 * ====== JOB CACHE
 */
const addJobToCache = job => userJobs['' + job.userId] = job

const removeJobFromCache = userId => delete userJobs['' + userId]

const getJobFromCache = userId => userJobs[userId]

const init = (io) => {

  io.on('connection', async socket => {
    // Send a JOB_UPDATE message if the user has an active job
    const userId = socket.request.session.passport.user
    if (userId) {
      userSockets[userId] = socket

      const job = getJobFromCache(userId)

      if (job) {
        notifyUser(job)
      }

      socket.on('disconnect', () => {
        delete userSockets[userId]
      })
    }
  })

}

const notifyUser = (job) => {
  const socket = userSockets[job.userId]
  if (socket)
    throttle((job) => socket.emit(jobSocketEvents.update, job.toJSON()), `socket_${job.id}`, 250)(job)
}

const cancelActiveJobByUserId = async (userId) => {
  const job = getJobFromCache(userId)
  if (job && !job.isEnded()) {
    job.cancel()
  }
}

const executeJobThread = (jobType, params) => {
  const worker = new Worker(path.resolve(__dirname, 'jobThread.js'), {workerData: {jobType, params}})

  worker.on('message', msg => {
    console.log('job started', msg)
  })
}

module.exports = {
  executeJobThread,
  init,
  cancelActiveJobByUserId,
}