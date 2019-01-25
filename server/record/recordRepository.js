const R = require('ramda')
const camelize = require('camelize')

const db = require('../db/db')
const { selectDate } = require('../db/dbUtils')

const { getSurveyDBSchema } = require('../../server/survey/surveySchemaRepositoryUtils')

const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')

const NodeDefTable = require('../../common/surveyRdb/nodeDefTable')
const SchemaRdb = require('../../common/surveyRdb/schemaRdb')

const recordSelectFields = `id, uuid, owner_id, step, ${selectDate('date_created')}, preview, validation`

const dbTransformCallback = (surveyId) => R.pipe(
  camelize,
  R.assoc('surveyId', surveyId)
)

// ============== CREATE

const insertRecord = async (surveyId, record, client = db) =>
  await client.one(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.record 
    (owner_id, uuid, step, preview)
    VALUES ($1, $2, $3, $4)
    RETURNING ${recordSelectFields}`,
    [Record.getOwnerId(record), Record.getUuid(record), Record.getStep(record), Record.isPreview(record)],
    dbTransformCallback(surveyId)
  )

// ============== READ

const countRecordsBySurveyId = async (surveyId, client = db) =>
  await client.one(`SELECT count(*) FROM ${getSurveyDBSchema(surveyId)}.record WHERE preview = FALSE`)

const fetchRecordsSummaryBySurveyId = async (surveyId, nodeDefRoot, nodeDefKeys, offset = 0, limit = null, client = db) => {

  const rootEntityTableAlias = 'n0'
  const getNodeDefKeyColName = R.pipe(NodeDefTable.getColNames, R.head)
  const getNodeDefKeyColAlias = NodeDef.getNodeDefName
  const nodeDefKeysSelect = nodeDefKeys.map(
    nodeDefKey => `${rootEntityTableAlias}.${getNodeDefKeyColName(nodeDefKey)} as "${getNodeDefKeyColAlias(nodeDefKey)}"`
  ).join(',')

  return await client.map(`
    SELECT 
      r.id, r.uuid, r.owner_id, r.step, ${selectDate('r.date_created', 'date_created')},
      n.date_modified,
      u.name as owner_name,
      ${nodeDefKeysSelect}
    FROM ${getSurveyDBSchema(surveyId)}.record r
    -- GET OWNER NAME
    JOIN "user" u
      ON r.owner_id = u.id
    -- GET LAST MODIFIED NODE DATE
    LEFT OUTER JOIN (
         SELECT 
           record_uuid, ${selectDate('MAX(date_modified)', 'date_modified')}
         FROM ${getSurveyDBSchema(surveyId)}.node
         GROUP BY record_uuid
    ) as n
      ON r.uuid = n.record_uuid
    -- join with root entity table to get node key values 
    LEFT OUTER JOIN
      ${SchemaRdb.getName(surveyId)}.${NodeDefTable.getViewName(nodeDefRoot)} as ${rootEntityTableAlias}
    ON r.uuid = ${rootEntityTableAlias}.record_uuid
    WHERE r.preview = FALSE
    ORDER BY r.id DESC
    LIMIT ${limit ? limit : 'ALL'}
    OFFSET ${offset}
  `,
    [],
    dbTransformCallback(surveyId)
  )
}

const fetchRecordByUuid = async (surveyId, recordUuid, client = db) =>
  await client.one(
    `SELECT 
     ${recordSelectFields}
     FROM ${getSurveyDBSchema(surveyId)}.record WHERE uuid = $1`,
    [recordUuid],
    dbTransformCallback(surveyId)
  )

// ============== UPDATE
const updateValidation = async (surveyId, recordUuid, validation, client = db) =>
  await client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.record 
     SET validation = $1::jsonb
     WHERE uuid = $2
    RETURNING ${recordSelectFields}`,
    [validation, recordUuid]
  )

// ============== DELETE
const deleteRecord = async (user, surveyId, recordUuid, client = db) =>
  await client.query(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.record
    WHERE uuid = $1
    `,
    [recordUuid]
  )

module.exports = {
  // CREATE
  insertRecord,

  // READ
  countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchRecordByUuid,

  // UPDATE
  updateValidation,

  // DELETE
  deleteRecord,
}
