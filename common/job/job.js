const R = require('ramda')

const jobStatus = {
  pending: 'pending',
  initialized: 'initialized',
  running: 'running',
  completed: 'completed',
  canceled: 'canceled',
  failed: 'failed',
}

const jobSocketEvents = {
  update: 'JOB_UPDATE',
}

const getJobStatus = R.prop('status')

const getJobProgressPercent = job => job.total > 0 ? Math.floor(100 * job.processed / job.total) : 0

const isJobStatusEnded = status =>
  R.contains(status, [
    jobStatus.completed,
    jobStatus.failed,
    jobStatus.canceled
  ])

const isJobEnded = job => isJobStatusEnded(getJobStatus(job))

const isJobRunning = job => !isJobEnded(job)

module.exports = {
  //UTILS
  jobStatus,

  //READ
  getJobName: R.path(['props', 'name']),
  getJobErrors: R.pathOr({}, ['props', 'errors']),
  getJobStatus,
  getJobProgressPercent,
  isJobRunning,
  isJobCompleted: R.pipe(getJobStatus, R.equals(jobStatus.completed)),
  isJobEnded,
  isJobCanceled: R.pipe(getJobStatus, R.equals(jobStatus.canceled)),
  isJobFailed: R.pipe(getJobStatus, R.equals(jobStatus.failed)),
  isJobStatusEnded,

  jobSocketEvents,
}