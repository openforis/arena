const {uuidv4} = require('../../common/uuid')
const {throttle} = require('../../common/functions')

const {
  jobStatus,
  getJobStatus,
  isJobEnded,
} = require('../../common/job/job')
const {
  insertSurveyJob,
  fetchSurveyJobById: fetchSurveyJobByIdRepos,
  fetchActiveSurveyJob: fetchActiveSurveyJobRepos,
  updateSurveyJob: updateJobRepos,
} = require('./jobRepository')

/**
 * ====== CREATE
 */
const createSurveyJob = async (surveyId, name) => {
  const job = {
    uuid: uuidv4(),
    props: {
      name,
    },
  }
  return await insertSurveyJob(surveyId, job)
}

/**
 * ====== READ
 */

/**
 * ====== UPDATE
 */
const updateSurveyJob = async (surveyId, jobId, status, total, processed, props = {}) =>
  await throttle(internalUpdateSurveyJob, `job_${jobId}`, 1000)(surveyId, jobId, status, total, processed, props)

const internalUpdateSurveyJob = async (surveyId, jobId, status, total, processed, props = {}) => {
  const job = await fetchSurveyJobByIdRepos(surveyId, jobId)
  if (getJobStatus(job) !== jobStatus.canceled) {
    return await updateJobRepos(surveyId, jobId, status, total, processed, props)
  } else {
    return job
  }
}

const cancelSurveyActiveJob = async (surveyId) => {
  const job = await fetchActiveSurveyJobRepos(surveyId)
  if (job && !isJobEnded(job)) {
    await internalUpdateSurveyJob(surveyId, job.id, jobStatus.canceled, job.total, job.processed)
  }
}

module.exports = {
  //CREATE
  createSurveyJob,
  //READ
  fetchSurveyJobById: fetchSurveyJobByIdRepos,
  fetchActiveSurveyJob: fetchActiveSurveyJobRepos,
  //UPDATE
  updateSurveyJob,
  cancelSurveyActiveJob,
}