const {uuidv4} = require('../../common/uuid')
const {throttle} = require('../../common/functions')

const {
  jobStatus,
  isJobEnded,
  isJobCanceled,
} = require('../../common/job/job')
const {
  insertSurveyJob,
  fetchSurveyJobById: fetchSurveyJobByIdRepos,
  fetchActiveSurveyJob: fetchActiveSurveyJobRepos,
  updateSurveyJobStatus: updateSurveyJobStatusRepos,
  updateSurveyJobProgress: updateSurveyJobProgressRepos,
} = require('./jobRepository')

/**
 * ====== CREATE
 */
const createSurveyJob = async (surveyId, name, onCancel = null) => {
  const job = {
    uuid: uuidv4(),
    props: {
      name,
    },
  }
  const jobDb = await insertSurveyJob(surveyId, job)

  if (onCancel) {
    //check every second if the job has been canceled and execute "onCancel" in that case
    const jobCheckInterval = setInterval(async () => {
      const reloadedJob = await fetchSurveyJobByIdRepos(surveyId, 200000)

      if (reloadedJob && isJobCanceled(reloadedJob)) {
        onCancel()
      }
      if (reloadedJob === null || isJobEnded(reloadedJob)) {
        clearInterval(jobCheckInterval)
      }
    }, 1000)
  }

  return jobDb
}

/**
 * ====== READ
 */

/**
 * ====== UPDATE
 */
const updateSurveyJobStatus = async (surveyId, jobId, status, props = {}) =>
  await updateSurveyJobStatusRepos(surveyId, jobId, status, props)

const updateSurveyJobProgress = async (surveyId, jobId, total, processed) =>
  await throttle(updateSurveyJobProgressRepos, `job_${jobId}`, 1000)(surveyId, jobId, total, processed)

const cancelSurveyActiveJob = async (surveyId) => {
  const job = await fetchActiveSurveyJobRepos(surveyId)
  if (job && !isJobEnded(job)) {
    await updateSurveyJobStatusRepos(surveyId, job.id, jobStatus.canceled)
  }
}

module.exports = {
  //CREATE
  createSurveyJob,
  //READ
  fetchSurveyJobById: fetchSurveyJobByIdRepos,
  fetchActiveSurveyJob: fetchActiveSurveyJobRepos,
  //UPDATE
  updateSurveyJobProgress,
  updateSurveyJobStatus,
  cancelSurveyActiveJob,
}