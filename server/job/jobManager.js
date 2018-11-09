const {throttle} = require('../../common/functionsDefer')

const {
  jobSocketEvents,
  isJobEnded,
  jobStatus,
} = require('../../common/job/job')

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
        //emit job event with job loaded from db (smaller)
        const jobDb = await jobRepository.fetchActiveJobByUserId(userId)
        socket.emit(jobSocketEvents.update, jobDb)
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

  const jobDb = await insertJobAndInnerJobs(job)

  job
    .onStart(updateJobStatusFromEvent)
    .onProgress(async event => await updateJobProgress(event.jobId, event.totalItems, event.processedItems))
    .onFail(updateJobStatusFromEvent)
    .onComplete(updateJobStatusFromEvent)
    .onCancel(updateJobStatusFromEvent)
    .onEnd(async () => removeJobFromCache(job.userId))
    .onInnerJobEvent(async event => {
      if (event.status === jobStatus.running) {
        await updateJobProgress(event.jobId, event.total, event.processed)
      } else {
        await updateJobStatusFromEvent(event)
      }
    })

  job.start()

  notifyUser(jobDb)

  return jobDb
}

const insertJobAndInnerJobs = async job => {
  console.log('inserting job', job.props.name)
  const jobDb = await jobRepository.insertJob(job)
  job.id = jobDb.id

  for (const innerJob of job.innerJobs) {
    await insertJobAndInnerJobs(innerJob)
  }

  return jobDb
}

/**
 * ====== UPDATE
 */

const updateJobStatusFromEvent = async jobEvent => {
  console.log('job event', jobEvent)

  const {jobId, status, totalItems, processedItems, errors = {}} = jobEvent
  await updateJobStatus(jobId, status, totalItems, processedItems, {errors})
}

const updateJobStatus = async (jobId, status, total, processed, props = {}) => {
  const job = await jobRepository.updateJobStatus(jobId, status, total, processed, props)
  notifyUser(job)
}

const updateJobProgress = async (jobId, total, processed) => {
  throttle(jobRepository.updateJobProgress, `job_${jobId}`, 1000)(jobId, total, processed)

  const job = await jobRepository.fetchJobById(jobId)
  if (job) {
    notifyUser(job)
  }
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
  updateJobProgress,
  updateJobStatus,
  cancelActiveJobByUserId,
}