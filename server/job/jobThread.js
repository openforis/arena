const {Worker, isMainThread, parentPort, workerData} = require('worker_threads')

const {throttle} = require('../../common/functionsDefer')

const {jobTypes, jobEvents, jobStatus, jobToJSON} = require('./jobUtils')
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

const startCheckJobCanceledMonitor = job => {
  setTimeout(async () => {
    const reloadedJob = await JobManager.fetchJobById(job.id)
    if (reloadedJob.status === jobStatus.canceled) {
      job.cancel()
    }
    if (!job.isEnded()) {
      startCheckJobCanceledMonitor(job)
    }
  }, 2000)
}

const createJob = async (jobType, params) => {
  const jobClass = getJobClass(jobType)

  const job = new jobClass(params)

  parentPort.postMessage({type: jobEvents.created, job: jobToJSON(job)})

  await JobManager.insertJob(job)

  return job
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
      if (jobEvent.type === jobEvents.created) {
        resolve(jobEvent.job)
      } else {
        const job = await JobManager.fetchJobById(jobEvent.masterJobId)
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

  createJob(jobType, params)
    .then(job => {

      startCheckJobCanceledMonitor(job)

      job
        .onEvent(handleJobEvent)
        .start()
    })
}

module.exports = {
  executeJobThread,
}