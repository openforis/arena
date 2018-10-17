const db = require('../db/db')
const camelize = require('camelize')

const {getSurveyDBSchema} = require('../../common/survey/survey')
const {isJobStatusEnded} = require('../../common/job/job')

// ============== CREATE

const insertJob = async (surveyId, job, client = db) =>
  await client.one(`
        INSERT INTO ${getSurveyDBSchema(surveyId)}.job (uuid, props)
        VALUES ($1, $2)
        RETURNING *`,
    [job.uuid, job.props],
    camelize
  )

// ============== READ

const fetchJobById = async (surveyId, id, client = db) =>
  await client.one(
    `SELECT * FROM ${getSurveyDBSchema(surveyId)}.job
     WHERE id = $1`,
    [id],
    camelize
  )

// ============== UPDATE

const updateJob = async (surveyId, id, status, total, processed, props, client = db) =>
  await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.job
     SET 
        status = $1,
        total = $2,
        processed = $3,
        props = props || $4,
        date_ended = $5
     WHERE id = $6
     RETURNING *`,
    [status, total, processed, props, isJobStatusEnded(status) ? new Date() : null, id],
    camelize
  )

module.exports = {
  //CREATE
  insertJob,
  //READ
  fetchJobById,
  //UPDATE
  updateJob,
  //DELETE
}