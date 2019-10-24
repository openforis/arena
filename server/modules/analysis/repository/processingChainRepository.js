const db = require('@server/db/db')
const DbUtils = require('@server/db/dbUtils')

const {
  getSurveyDBSchema,
  dbTransformCallback,
} = require('../../survey/repository/surveySchemaRepositoryUtils')

const selectFields = `uuid, cycle, props, status_exec, ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate('date_modified')}, ${DbUtils.selectDate('date_executed')}`

// CREATE
const insertChain = async (surveyId, cycle, client = db) =>
  await client.one(`
      INSERT INTO ${getSurveyDBSchema(surveyId)}.processing_chain (cycle)
      VALUES ($1)
      RETURNING ${selectFields}
    `,
    [cycle],
    dbTransformCallback
  )

// READ
const countChainsBySurveyId = async (surveyId, cycle, client = db) =>
  await client.one(`
      SELECT COUNT(*) 
      FROM ${getSurveyDBSchema(surveyId)}.processing_chain
      WHERE cycle = $1
    `,
    [cycle]
  )

const fetchChainsBySurveyId = async (surveyId, cycle, offset = 0, limit = null, client = db) =>
  await client.map(`
      SELECT ${selectFields}
      FROM ${getSurveyDBSchema(surveyId)}.processing_chain
      WHERE cycle = $1
      ORDER BY date_modified DESC
      LIMIT ${limit || 'ALL'}
      OFFSET ${offset}
    `,
    [cycle],
    dbTransformCallback
  )

const fetchChainByUuid = async (surveyId, processingChainUuid, client = db) =>
  await client.one(`
      SELECT ${selectFields}
      FROM ${getSurveyDBSchema(surveyId)}.processing_chain
      WHERE uuid = $1
    `,
    [processingChainUuid]
  )

// UPDATE
const updateChainProp = async (surveyId, processingChainUuid, key, value, client = db) =>
  await client.one(`
      UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
      SET props = jsonb_set("props", '{${key}}', $2::jsonb),
          date_modified = ${DbUtils.now}
      WHERE uuid = $1
      RETURNING ${selectFields}
    `,
    [processingChainUuid, value],
    dbTransformCallback
  )

// DELETE
const deleteChain = async (surveyId, processingChainUuid, client = db) =>
  await client.none(`
      DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_chain
      WHERE uuid = $1
    `,
    [processingChainUuid]
  )

module.exports = {
  // CREATE
  insertChain,

  // READ
  countChainsBySurveyId,
  fetchChainsBySurveyId,
  fetchChainByUuid,

  // UPDATE
  updateChainProp,

  // DELETE
  deleteChain,
}