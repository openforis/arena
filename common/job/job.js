const R = require('ramda')

const jobStatus = {
  created: 'created',
  initialized: 'initialized',
  running: 'running',
  completed: 'completed',
  canceled: 'canceled',
  error: 'error',
}

const getJobStatus = R.prop('status')

const getJobProgressPercent = job => job.total > 0 ? Math.floor(100 * job.processed / job.total) : 0

const isJobStatusEnded = status =>
  R.contains(status, [
    jobStatus.completed,
    jobStatus.error,
    jobStatus.canceled
  ])

const isJobEnded = job => isJobStatusEnded(getJobStatus(job))

const isJobRunning = job => !isJobEnded(job)

module.exports = {
  //UTILS
  jobStatus,

  //READ
  getJobName: R.path(['props', 'name']),
  getJobStatus,
  getJobProgressPercent,
  isJobRunning,
  isJobCompleted: R.pipe(getJobStatus, R.equals(jobStatus.completed)),
  isJobEnded,
  isJobCanceled: R.pipe(getJobStatus, R.equals(jobStatus.canceled)),
  isJobStatusEnded,
}