const R = require('ramda')

const jobStatus = {
  pending: 'pending',
  running: 'running',
  succeeded: 'succeeded',
  canceled: 'canceled',
  failed: 'failed',
}

const jobEvents = {
  created: 'created',
  creationFailed: 'creationFailed',
  statusChange: 'statusChange', //job has changed its status
  progress: 'progress', //job is running and the processed items changed
}

const jobTypes = {
  surveyPublish: 'surveyPublish',
  taxonomyImport: 'taxonomyImport',
}

const calculateProgress = job => {
  const partialProgress = job.status === jobStatus.succeeded ?
    100
    : job.total > 0 ?
      Math.floor(100 * job.processed / job.total)
      : 0

  const innerJobs = job.innerJobs ? job.innerJobs : []

  const currentInnerJobIndex = innerJobs ?
    R.findLastIndex(j =>
      j.status === jobStatus.running ||
      j.status === jobStatus.failed ||
      j.status === jobStatus.canceled
      , innerJobs) : -1

  if (innerJobs.length === 0 || currentInnerJobIndex < 0 || partialProgress === 100) {
    return partialProgress
  } else {
    return partialProgress + Math.floor(calculateProgress(innerJobs[currentInnerJobIndex]) / job.total)
  }
}

const jobToJSON = job => ({
  ...job,

  innerJobs: R.map(j => jobToJSON(j), R.propOr([], 'innerJobs', job)),

  //STATUS
  pending: job.status === jobStatus.pending,
  running: job.status === jobStatus.running,
  succeeded: job.status === jobStatus.succeeded,
  canceled: job.status === jobStatus.canceled,
  failed: job.status === jobStatus.failed,
  ended: R.contains(job.status, [jobStatus.succeeded, jobStatus.canceled, jobStatus.failed]),

  progressPercent: calculateProgress(job),
})

module.exports = {
  jobStatus,
  jobEvents,
  jobTypes,

  jobToJSON,
}