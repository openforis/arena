const {Worker, isMainThread, parentPort, workerData} = require('worker_threads')

const {throttle} = require('../../common/functionsDefer')

const {jobTypes, jobEvents} = require('./jobUtils')
const JobManager = require('./jobManager')

const SurveyPublishJob = require('../survey/publish/surveyPublishJob')
const TaxonomyImportJob = require('../taxonomy/taxonomyImportJob')

const getJobClass = jobType => {
  switch (jobType) {
    case jobTypes.surveyPublish:
      return SurveyPublishJob
    case jobTypes.taxonomyImport:
      return TaxonomyImportJob
  }
}

const startJob = async (job) => {
  await JobManager.insertJob(job)

  parentPort.postMessage({type: jobEvents.created, masterJobId: job.id, jobId: job.id, userId: job.userId})

  job
    .onEvent(handleJobEvent)
    .start()
}

const handleJobEvent = async jobEvent => {
  const {jobId, status, total, processed, result = {}, errors = {}} = jobEvent

  if (jobEvent.type === jobEvents.statusChange) {
    await JobManager.updateJobStatus(jobId, status, total, processed, {result, errors})
  } else {
    throttle(JobManager.updateJobProgress, `job_${jobId}`, 1000)(jobId, total, processed)
  }

  parentPort.postMessage(jobEvent)
}

/**
 * Runs in main thread
 */
const executeJobThread = (jobType, params) => {
  return new Promise((resolve) => {
    const worker = new Worker(__filename, {workerData: {jobType, params}})

    worker.on('message', async jobEvent => {
      if (jobEvent.type === jobEvents.creationFailed) {
        resolve(null) //TODO handle errors from caller
      } else {
        const job = await JobManager.fetchJobById(jobEvent.masterJobId)

        if (jobEvent.type === jobEvents.created) {
          resolve(job)
        }

        JobManager.notifyJobUpdate(job)
      }
    })
  })
}

/**
 * Runs in worker thread
 */
if (!isMainThread) {
  const {params, jobType} = workerData
  const jobClass = getJobClass(jobType)

  const job = new jobClass(params)
  startJob(job)
}

module.exports = {
  executeJobThread,
}