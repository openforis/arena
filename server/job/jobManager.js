const db = require('../db/db')

const {throttle} = require('../../common/functionsDefer')

const {
  jobSocketEvents,
  isJobEnded,
} = require('../../common/job/job')

const {jobEventTypes} = require('./job')

const jobRepository = require('./jobRepository')

const userSockets = {}
const userJobs = {}

const init = (io) => {

  io.on('connection', async socket => {
    // Send a JOB_UPDATE message if the user has an active job
    const userId = socket.request.session.passport.user
    if (userId) {
      userSockets[userId] = socket

      const job = getJobFromCache(userId)

      if (job) {
        socket.emit(jobSocketEvents.update, job.toSummary())
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
    throttle((job) => socket.emit(jobSocketEvents.update, job), `socket_${job.id}`, 250)(job)
}

/**
 * ====== CREATE
 */

const startJob = async (job) => {
  addJobToCache(job)

  const jobDb = await db.tx(async t =>
    await insertJobAndInnerJobs(job, t)
  )

  job
    .onEvent(async event => {
      if (event.type === jobEventTypes.statusChange) {
        await updateJobStatusFromEvent(event)
      } else {
        await updateJobProgress(event.jobId, event.total, event.processed)
      }
      if (isJobEnded(job)) {
        removeJobFromCache(job.userId)
      }
      notifyUser(job.toSummary())
    })
    .start()

  notifyUser(job.toSummary())

  return jobDb
}

/**
 * Inserts job and its inner jobs into the db
 */
const insertJobAndInnerJobs = async (job, t) => {
  const jobDb = await jobRepository.insertJob(job, t)
  job.id = jobDb.id

  for (const innerJob of job.innerJobs) {
    innerJob.parentUUID = job.uuid
    await insertJobAndInnerJobs(innerJob, t)
  }

  return jobDb
}

/**
 * ====== UPDATE
 */

const updateJobStatusFromEvent = async jobEvent => {
  const {jobId, status, total, processed, result = {}, errors = {}} = jobEvent
  await jobRepository.updateJobStatus(jobId, status, total, processed, {result, errors})
}

const updateJobProgress = async (jobId, total, processed) => {
  throttle(jobRepository.updateJobProgress, `job_${jobId}`, 1000)(jobId, total, processed)
}

const cancelActiveJobByUserId = async (userId) => {
  const job = getJobFromCache(userId)
  if (job && !isJobEnded(job)) {
    job.cancel()
  }
}

/**
 * ====== JOB CACHE
 */
const addJobToCache = job => userJobs['' + job.userId] = job

const removeJobFromCache = userId => delete userJobs['' + userId]

const getJobFromCache = userId => userJobs[userId]

module.exports = {
  init,
  //CREATE
  startJob,
  //UPDATE
  cancelActiveJobByUserId,
}