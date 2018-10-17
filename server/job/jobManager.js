const {uuidv4} = require('../../common/uuid')
const {throttle} = require('../../common/functions')

const {
  insertJob,
  fetchJobById: repoFetchJobById,
  updateJob: updateJobRepos,
} = require('./jobRepository')

/**
 * ====== CREATE
 */
const createJob = async (surveyId, name) => {
  const job = {
    uuid: uuidv4(),
    props: {
      name,
    },
  }
  return await insertJob(surveyId, job)
}

/**
 * ====== READ
 */

/**
 * ====== UPDATE
 */
const updateJob = async (surveyId, jobId, status, total, processed, props = {}) =>
  await throttle(updateJobRepos, `job_${jobId}`, 1000)(surveyId, jobId, status, total, processed, props)

module.exports = {
  //CREATE
  createJob,
  //READ
  fetchJobById: repoFetchJobById,
  //UPDATE
  updateJob,
}