const {uuidv4} = require('../../common/uuid')
const R = require('ramda')
const {throttle} = require('../../common/functions')

const {
  insertJob,
  fetchJobById: repoFetchJobById,
  updateJobProps: repoUpdateJobProps,
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
      createdOn: new Date(),
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
  await updateJobProps(surveyId, jobId, {progressPercent}, 1000)

const updateJobStatus = async (surveyId, jobId, status) => {
  const props = R.pipe(
    R.when(
      R.propEq('status', jobStatus.completed),
      R.assoc('progressPercent', 100),
    ),
    R.when(
      R.anyPass([
        R.propEq('status', jobStatus.completed),
        R.propEq('status', jobStatus.error),
      ]),
      R.assoc('endedOn', new Date())
    )
  )({status})
  return await updateJobProps(surveyId, jobId, props)
}

const updateJobProps = async (surveyId, jobId, props, throttleDelay = 0) =>
  await throttle(repoUpdateJobProps, `job_${jobId}`, throttleDelay)(surveyId, jobId, props)

module.exports = {
  //CREATE
  createJob,
  //READ
  fetchJobById: repoFetchJobById,
  //UPDATE
  updateJobProgress,
  updateJobStatus,
}