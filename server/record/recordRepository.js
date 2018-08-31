const R = require('ramda')
const camelize = require('camelize')

const db = require('../db/db')
const {selectDate} = require('../db/dbUtils')

const {getSurveyDBSchema} = require('../../common/survey/survey')

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

const fetchRecordById = async (surveyId, recordId, client = db) => {
  const record = await client.one(
    `SELECT 
     ${recordSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.record WHERE id = $1`,
    [recordId],
    dbTransformCallback(surveyId)
  )
  return record
}

module.exports = {
  // CREATE
  insertRecord,

  // READ
  fetchRecordById,

  //UPDATE
}