const db = require('../db/db')
const R = require('ramda')
const camelize = require('camelize')

const {getSurveyDBSchema} = require('../../common/survey/survey')
const {updateSurveyTableProps} = require('../serverUtils/repository')

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

const updateJobProps = async (surveyId, id, props, client = db) =>
  updateSurveyTableProps('job', surveyId, id, props, false, client)

module.exports = {
  //CREATE
  insertJob,
  //READ
  fetchJobById,
  //UPDATE
  updateJobProps,
  //DELETE
}