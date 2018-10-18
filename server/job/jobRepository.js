const db = require('../db/db')
const camelize = require('camelize')

const {getSurveyDBSchema} = require('../../common/survey/survey')
const {jobStatus, isJobStatusEnded} = require('../../common/job/job')

// ============== CREATE

const insertSurveyJob = async (surveyId, job, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.job (uuid, props)
        VALUES ($1, $2)
        RETURNING *`,
    [job.uuid, job.props],
    camelize
  )

// ============== READ

const fetchSurveyJobById = async (surveyId, id, client = db) =>
  await client.oneOrNone(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.job
     WHERE id = $1`,
    [id],
    camelize
  )

const fetchActiveSurveyJob = async (surveyId, client = db) =>
  await client.oneOrNone(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.job
     WHERE status = '${jobStatus.created}' OR status = '${jobStatus.running}'`,
    [],
    camelize
  )

// ============== UPDATE

const updateSurveyJobStatus = async (surveyId, id, status, props = {}, client = db) =>
  await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.job
     SET 
        status = $1,
        props = props || $2,
        date_ended = $3
     WHERE id = $4
     RETURNING *`,
    [status, props, isJobStatusEnded(status) ? new Date() : null, id],
    camelize
  )

const updateSurveyJobProgress = async (surveyId, id, total, processed, client = db) =>
  await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.job
     SET 
        total = $1,
        processed = $2
     WHERE id = $3
     RETURNING *`,
    [total, processed, id],
    camelize
  )

module.exports = {
  //CREATE
  insertSurveyJob,
  //READ
  fetchSurveyJobById,
  fetchActiveSurveyJob,
  //UPDATE
  updateSurveyJobProgress,
  updateSurveyJobStatus,
  //DELETE
}