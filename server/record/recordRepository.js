const R = require('ramda')
const camelize = require('camelize')

const db = require('../db/db')
const {selectDate} = require('../db/dbUtils')

const {getSurveyDBSchema} = require('../../server/survey/surveySchemaRepositoryUtils')

const recordSelectFields = `id, uuid, owner_id, step, ${selectDate('date_created')}`

const dbTransformCallback = (surveyId) => R.pipe(
  camelize,
  R.assoc('surveyId', surveyId)
)

// ============== CREATE

const insertRecord = async (record, client = db) =>
  await client.one(`
    INSERT INTO ${getSurveyDBSchema(record.surveyId)}.record 
    (owner_id, uuid, step)
    VALUES ($1, $2, $3)
    RETURNING ${recordSelectFields}`,
    [record.ownerId, record.uuid, record.step],
    dbTransformCallback(record.surveyId)
  )

// ============== READ

const countRecordsBySurveyId = async (surveyId, client = db) =>
  await client.one(`SELECT count(*) FROM ${getSurveyDBSchema(surveyId)}.record`)

const fetchRecordsBySurveyId = async (surveyId, offset, limit, client = db) =>
  await client.any(`
    SELECT ${recordSelectFields}
    FROM ${getSurveyDBSchema(surveyId)}.record
    LIMIT $1
    OFFSET $2
  `,
    [limit, offset],
    dbTransformCallback(surveyId)
  )

const fetchRecordById = async (surveyId, recordId, client = db) =>
  await client.one(
    `SELECT 
     ${recordSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.record WHERE id = $1`,
    [recordId],
    dbTransformCallback(surveyId)
  )

module.exports = {
  // CREATE
  insertRecord,

  // READ
  countRecordsBySurveyId,
  fetchRecordsBySurveyId,
  fetchRecordById,

  //UPDATE
}