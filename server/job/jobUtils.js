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
  statusChange: 'statusChange', //job has changed its status
  progress: 'progress', //job is running and the processed items changed
}

const jobThreadMessageTypes = {
  fetchJob: 'fetchJob',
  cancelJob: 'cancelJob',
}

module.exports = {
  jobStatus,
  jobEvents,
  jobThreadMessageTypes,
}