const {parentPort, workerData} = require('worker_threads')

const {throttle} = require('../../common/functionsDefer')

const {jobTypes, jobEvents, jobStatus} = require('./jobUtils')
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

const copyJobId = (fromJob, toJob) => {
  toJob.id = fromJob.id
  toJob.uuid = fromJob.uuid
  toJob.masterJobId = fromJob.masterJobId

  fromJob.innerJobs.forEach((fromInnerJob, idx) => {
    const toInnerJob = toJob.innerJobs[idx]
    copyJobId(fromInnerJob, toInnerJob)
  })
}

const createJob = (jobData, params) => {
  const jobClass = getJobClass(jobData.type)

  const job = new jobClass(params)
  copyJobId(jobData, job)

  return job
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

const handleJobEvent = async jobEvent => {
  const {jobId, status, total, processed, result = {}, errors = {}} = jobEvent

  if (jobEvent.type === jobEvents.statusChange) {
    await JobManager.updateJobStatus(jobId, status, total, processed, {result, errors})
  } else {
    throttle(JobManager.updateJobProgress, `job_${jobId}`, 1000)(jobId, total, processed)
  }

  parentPort.postMessage(jobEvent)
}

const execute = () => {
  const {job: jobData, params} = workerData

  const job = createJob(jobData, params)

  startCheckJobCanceledMonitor(job)

  job
    .onEvent(handleJobEvent)
    .start()
}

execute()