const R = require('ramda')
const camelize = require('camelize')

const db = require('../../../db/db')
const { selectDate } = require('../../../db/dbUtils')

const { getSurveyDBSchema } = require('../../../survey/surveySchemaRepositoryUtils')

const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Validator = require('../../../../common/validation/validator')

const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')
const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')

const recordSelectFields = `id, uuid, owner_id, step, ${selectDate('date_created')}, preview, validation`

const dbTransformCallback = (surveyId, includeValidationFields = true) => record => {
  const validation = Record.getValidation(record)
  return R.pipe(
    R.dissoc(Validator.keys.validation),
    camelize,
    R.assoc('surveyId', surveyId),
    R.assoc(
      Validator.keys.validation,
      includeValidationFields ? validation : { [Validator.keys.valid]: Validator.isValidationValid(validation) },
    ),
  )(record)
}

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
      r.id, r.uuid, r.owner_id, r.step, ${selectDate('r.date_created', 'date_created')}, validation,
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
    dbTransformCallback(surveyId, false)
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

const fetchRecordUuids = async (surveyId, client = db) => await client.map(
  `SELECT uuid 
  FROM ${getSurveyDBSchema(surveyId)}.record 
  WHERE preview = FALSE
  `,
  [],
  R.prop('uuid')
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

const updateRecordStep = async (surveyId, recordUuid, step, client = db) =>
  await client.none(`
      UPDATE ${getSurveyDBSchema(surveyId)}.record
      SET step = $1
      WHERE uuid = $2`,
    [step, recordUuid]
  )

// ============== DELETE

const deleteRecord = async (user, surveyId, recordUuid, client = db) =>
  await client.query(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.record
    WHERE uuid = $1
    `,
    [recordUuid]
  )

const deleteRecordsPreview = async (surveyId, client = db) =>
  await client.any(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.record
    WHERE preview = $1
    `,
    [true]
  )

module.exports = {
  // CREATE
  insertRecord,

  // READ
  countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchRecordByUuid,
  fetchRecordUuids,

  // UPDATE
  updateValidation,
  updateRecordStep,

  // DELETE
  deleteRecord,
  deleteRecordsPreview,
}
