const R = require('ramda')

const jobStatus = {
  created: 'created',
  initialized: 'initialized',
  running: 'running',
  completed: 'completed',
  error: 'error',
}

const getJobProgressPercent = job => job.total > 0 ? Math.ceil(100 * job.processed / this.total) : 0

const isJobStatusEnded = status =>
  R.contains(status, [jobStatus.completed, jobStatus.error])

module.exports = {
  //UTILS
  jobStatus,

  //READ
  getJobProgressPercent,
  isJobStatusEnded,
}