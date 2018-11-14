const {isMainThread, parentPort, workerData} = require('worker_threads')

const db = require('../db/db')
const {throttle} = require('../../common/functionsDefer')

const jobRepository = require('./jobRepository')
const {getJobClass} = require('./jobProps')

const startJob = async (job) => {
  await db.tx(async t =>
    await insertJobAndInnerJobs(job, t)
  )

  // addJobToCache(job)

  job
    .onEvent(async jobEvent => {
      parentPort.postMessage(jobEvent)

      if (jobEvent.type === jobEvents.statusChange) {
        await updateJobStatusFromEvent(jobEvent)
      } else {
        await updateJobProgress(jobEvent.jobId, jobEvent.total, jobEvent.processed)
      }

      // notifyUser(job)

      // if (job.isEnded()) {
      //   removeJobFromCache(job.userId)
      // }

    })
    .start()
}

const insertJobAndInnerJobs = async (job, t) => {
  const jobDb = await jobRepository.insertJob(job, t)
  job.id = jobDb.id

  for (const innerJob of job.innerJobs) {
    innerJob.parentId = job.id
    await insertJobAndInnerJobs(innerJob, t)
  }

  return jobDb
}

const updateJobStatusFromEvent = async jobEvent => {
  const {jobId, status, total, processed, result = {}, errors = {}} = jobEvent
  await jobRepository.updateJobStatus(jobId, status, total, processed, {result, errors})
}

const updateJobProgress = async (jobId, total, processed) => {
  throttle(jobRepository.updateJobProgress, `job_${jobId}`, 1000)(jobId, total, processed)
}

if (!isMainThread) {
  const {params, jobType} = workerData
  const jobClass = getJobClass(jobType)

  const job = new jobClass(params)
  // job.start()
  startJob(job)
}