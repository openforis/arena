const {parentPort, workerData} = require('worker_threads')

const {throttle} = require('../../common/functionsDefer')

const {jobEvents, jobStatus} = require('./jobUtils')
const JobManager = require('./jobManager')

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
  const {jobId, params} = workerData

  JobManager.createJobInstance(jobId, params)
    .then(job => {
      console.log('++++++ createJobInstance ', JSON.stringify(job))

      startCheckJobCanceledMonitor(job)

      job
        .onEvent(handleJobEvent)
        .start()
    })
}

execute()