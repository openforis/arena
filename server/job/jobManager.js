const {uuidv4} = require('../../common/uuid')
const {throttle} = require('../../common/functionsDefer')

const {
  jobStatus,
  isJobEnded,
  isJobCanceled,
} = require('../../common/job/job')
const {
  insertJob,
  fetchJobById: fetchJobByIdRepos,
  fetchActiveJobByUserId: fetchActiveJobByUserIdRepos,
  updateJobStatus: updateJobStatusRepos,
  updateJobProgress: updateJobProgressRepos,
} = require('./jobRepository')

/**
 * ====== CREATE
 */
const createJob = async (userId, surveyId, name, onCancel = null) => {
  const job = {
    uuid: uuidv4(),
    userId,
    surveyId,
    props: {
      name,
    },
  }
  const jobDb = await insertJob(job)

  if (onCancel) {
    //check every second if the job has been canceled and execute "onCancel" in that case
    const jobCheckInterval = setInterval(async () => {
      const reloadedJob = await fetchJobByIdRepos(jobDb.id)

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
const fetchActiveJobByUserId = async (userId) =>
  await fetchActiveJobByUserIdRepos(userId)

/**
 * ====== UPDATE
 */
const updateJobStatus = async (jobId, status, total, processed, props = {}) =>
  await updateJobStatusRepos(jobId, status, total, processed, props)

const updateJobProgress = async (jobId, total, processed) =>
  await throttle(updateJobProgressRepos, `job_${jobId}`, 1000)(jobId, total, processed)

const cancelActiveJobByUserId = async (userId) => {
  const job = await fetchActiveJobByUserIdRepos(userId)
  if (job && !isJobEnded(job)) {
    await updateJobStatusRepos(job.id, jobStatus.canceled, job.total, job.processed)
  }
}

module.exports = {
  //CREATE
  createJob,
  //READ
  fetchJobById: fetchJobByIdRepos,
  fetchActiveJobByUserId,
  //UPDATE
  updateJobProgress,
  updateJobStatus,
  cancelActiveJobByUserId,
}