const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const SurveyPublishJob = require('./surveyPublishJob')
const JobManager = require('../../job/jobManager')

if(isMainThread) {

} else {
  const {userId, surveyId} = workerData
  const job = new SurveyPublishJob(userId, surveyId)
  JobManager.startJob(job)

  parentPort.postMessage({jobUUID: job.uuid})
}

const startSurveyPublish = (userId, surveyId) => {
  let w = new Worker(__filename, {workerData: {userId, surveyId}})

  w.on('message', msg => {
    console.log('job started', msg)
  })
}

module.exports = {
  startSurveyPublish
}