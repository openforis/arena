const {uuidv4} = require('../../common/uuid')
const {throttle} = require('../../common/functionsDefer')

const {
  jobStatus,
  isJobEnded,
  isJobCanceled,
} = require('../../common/job/job')
const {
  insertJob,
  fetchJobById: fetchJobByIdRepos,
  fetchActiveJobByUserId: fetchActiveJobByUserIdRepos,
  updateJobStatus: updateJobStatusRepos,
  updateJobProgress: updateJobProgressRepos,
} = require('./jobRepository')

this.userSockets = {}
this.jobSockets = {}

const init = (io) => {
  io.on('connection', async socket => {
    // Send a JOB_UPDATE message if the user has an active job
    const userId = socket.request.session.passport.user;
    if (userId) {
      this.userSockets[userId] = socket
      const job = await fetchActiveJobByUserId(userId)
      if (job) {
        this.jobSockets[job.id] = socket
        socket.emit('JOB_UPDATE', job)
      }
    }
  })
}

notifyUser = (job) => {
  const socket = this.jobSockets[job.id]
  if (socket)
    throttle((job) => socket.emit('JOB_UPDATE', job), `socket_${job.id}`, 200)(job)
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
  const jobDb = await insertJob(job)

  this.jobSockets[jobDb.id] = this.userSockets[jobDb.userId]
  notifyUser(job)

  if (onCancel) {
    //check every second if the job has been canceled and execute "onCancel" in that case
    const jobCheckInterval = setInterval(async () => {
      const reloadedJob = await fetchJobByIdRepos(jobDb.id)

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
 * ====== READ
 */
const fetchActiveJobByUserId = async (userId) =>
  await fetchActiveJobByUserIdRepos(userId)

/**
 * ====== UPDATE
 */
const updateJobStatus = async (jobId, status, total, processed, props = {}) => {
  const job = await updateJobStatusRepos(jobId, status, total, processed, props)

  notifyUser(job)
  if (status === jobStatus.completed ||
      status === jobStatus.canceled ||
      status === jobStatus.failed) {
    delete this.jobSockets[jobId]
  }
}

const updateJobProgress = async (jobId, total, processed) => {
  throttle(updateJobProgressRepos, `job_${jobId}`, 1000)(jobId, total, processed)

  const job = await fetchJobByIdRepos(jobId)
  if (job) {
    notifyUser(job)
  }
}

const cancelActiveJobByUserId = async (userId) => {
  const job = await fetchActiveJobByUserIdRepos(userId)
  if (job && !isJobEnded(job)) {
    updateJobStatusRepos(job.id, jobStatus.canceled, job.total, job.processed)
    notifyUser(job)
  }
}

module.exports = {
  init,
  //CREATE
  createJob,
  //READ
  fetchJobById: fetchJobByIdRepos,
  fetchActiveJobByUserId,
  //UPDATE
  updateJobProgress,
  updateJobStatus,
  cancelActiveJobByUserId,
}