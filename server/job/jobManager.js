const db = require('../db/db')

const {throttle} = require('../../common/functionsDefer')

const {jobEvents} = require('./job')
const jobSocketEvents = require('../../common/job/jobSocketEvents')

const jobRepository = require('./jobRepository')

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

/**
 * ====== CREATE
 */

const startJob = async (job) => {
  await db.tx(async t =>
    await insertJobAndInnerJobs(job, t)
  )

  addJobToCache(job)

  job
    .onEvent(async jobEvent => {
      if (jobEvent.type === jobEvents.statusChange) {
        await updateJobStatusFromEvent(jobEvent)
      } else {
        await updateJobProgress(jobEvent.jobId, jobEvent.total, jobEvent.processed)
      }

      notifyUser(job)

      if (job.isEnded()) {
        removeJobFromCache(job.userId)
      }
    })
    .start()

  return job.toJSON()
}

/**
 * Inserts job and its inner jobs into the db
 */
const insertJobAndInnerJobs = async (job, t) => {
  const jobDb = await jobRepository.insertJob(job, t)
  job.id = jobDb.id

  for (const innerJob of job.innerJobs) {
    innerJob.parentId = job.id
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
  if (job && !job.isEnded()) {
    job.cancel()
  }
}

module.exports = {
  init,
  //CREATE
  startJob,
  //UPDATE
  updateJobStatusFromEvent,
  updateJobProgress,
  cancelActiveJobByUserId,
}