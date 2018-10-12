const {uuidv4} = require('../../common/uuid')
const R = require('ramda')

const {
  insertJob,
  fetchJobById: dbFetchJobById,
  updateJobProps,
} = require('./jobRepository')

const {
  jobStatus
} = require('../../common/job/job')

/**
 * ====== CREATE
 */
const createJob = async (surveyId, title) => {
  const job = {
    uuid: uuidv4(),
    props: {
      title,
      status: 'created',
      startedOn: new Date(),
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
const updateJobProgress = async (surveyId, jobId, progressPercent) =>
  await updateJobProps(surveyId, jobId, {progressPercent})

const updateJobStatus = async (surveyId, jobId, status) => {
  const props = {status}
  const finalProps = status === jobStatus.completed
    ? R.assoc('progressPercent', 100)(props)
    : props
  return await updateJobProps(surveyId, jobId, finalProps)
}

module.exports = {
  //CREATE
  createJob,
  //READ
  fetchJobById: dbFetchJobById,
  //UPDATE
  updateJobProgress,
  updateJobStatus,
}