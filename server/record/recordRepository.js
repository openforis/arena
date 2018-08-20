const camelize = require('camelize')
const db = require('../db/db')

const {surveyDataSchema, getSurveyDefaultStep} = require('../../common/survey/survey')

const dbTransformCallback = r =>
  r ? camelize(r)
  : null

// ============== CREATE

const createRecord = async (user, survey, client = db) => client.tx(
  async tx =>
    await tx.one(
      `INSERT INTO ${surveyDataSchema(survey.id)}.record (owner_id, step)
       VALUES ($1, $2)
       RETURNING *`,
      [user.id, getSurveyDefaultStep(survey)],
      r => dbTransformCallback(r)
    )
)

// ============== READ

const fetchRecordById = async (surveyId, recordId, client = db) => {
  const record = await client.one(
    `SELECT * FROM ${surveyDataSchema(surveyId)}.record WHERE id = $1`,
    [recordId],
    r => dbTransformCallback(r)
  )
  return record
}

module.exports = {
  // CREATE
  createRecord,

  // READ
  fetchRecordById,

  //UPDATE
}