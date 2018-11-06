const {uuidv4} = require('../../common/uuid')
const {throttle} = require('../../common/functionsDefer')

const {
  jobSocketEvents,
  jobStatus,
  isJobEnded,
  isJobCanceled,
} = require('../../common/job/job')

const jobRepository = require('./jobRepository')

const userSockets = {}

const init = (io) => {

  io.on('connection', async socket => {
    // Send a JOB_UPDATE message if the user has an active job
    const userId = socket.request.session.passport.user
    if (userId) {
      userSockets[userId] = socket
      const job = await jobRepository.fetchActiveJobByUserId(userId)

      if (job) {
        socket.emit(jobSocketEvents.update, job)
      }
    }
  })

}

const notifyUser = (job) => {
  const socket = userSockets[job.userId]
  if (socket)
    throttle((job) => socket.emit(jobSocketEvents.update, job), `socket_${job.id}`, 250)(job)
}

/**
 * ====== CREATE
 */
const createJob = async (userId, surveyId, name, onCancel = null) => {
  const job = {
    uuid: uuidv4(),
    userId,
    surveyId,
    props: {
      name,
    },
  }
  const jobDb = await jobRepository.insertJob(job)

  notifyUser(job)

  if (onCancel) {
    //check every second if the job has been canceled and execute "onCancel" in that case
    const jobCheckInterval = setInterval(async () => {
      const reloadedJob = await jobRepository.fetchJobById(jobDb.id)

      if (reloadedJob && isJobCanceled(reloadedJob)) {
        onCancel()
      }
      if (reloadedJob === null || isJobEnded(reloadedJob)) {
        clearInterval(jobCheckInterval)
      }
    }, 1000)
  }

  return jobDb
}

/**
 * ====== UPDATE
 */
const updateJobStatus = async (jobId, status, total, processed, props = {}) => {
  const job = await jobRepository.updateJobStatus(jobId, status, total, processed, props)

  notifyUser(job)
  if (status === jobStatus.completed ||
    status === jobStatus.canceled ||
    status === jobStatus.failed) {
    delete userSockets[job.userId]
  }
}

const updateJobProgress = async (jobId, total, processed) => {
  throttle(jobRepository.updateJobProgress, `job_${jobId}`, 1000)(jobId, total, processed)

  const job = await jobRepository.fetchJobById(jobId)
  if (job) {
    notifyUser(job)
  }
}

const cancelActiveJobByUserId = async (userId) => {
  const job = await jobRepository.fetchActiveJobByUserId(userId)
  if (job && !isJobEnded(job)) {
    await jobRepository.updateJobStatus(job.id, jobStatus.canceled, job.total, job.processed)
    notifyUser(job)
  }
}

module.exports = {
  init,
  //CREATE
  createJob,
  //READ
  fetchJobById: jobRepository.fetchJobById,

  //UPDATE
  updateJobProgress,
  updateJobStatus,
  cancelActiveJobByUserId,
}