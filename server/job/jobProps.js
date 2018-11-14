const SurveyPublishJob = require('../survey/publish/surveyPublishJob')

const jobStatus = {
  pending: 'pending',
  running: 'running',
  succeeded: 'succeeded',
  canceled: 'canceled',
  failed: 'failed',
}

const jobEvents = {
  statusChange: 'statusChange', //job has changed its status
  progress: 'progress', //job is running and the processed items changed
}

const jobTypes = {
  surveyPublish: 'surveyPublish'
}

const getJobClass = jobType => {
  switch (jobType) {
    case jobTypes.surveyPublish:
      return SurveyPublishJob
  }
}

module.exports = {
  jobStatus,
  jobEvents,
  jobTypes,
  getJobClass,
}
