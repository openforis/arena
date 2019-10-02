const R = require('ramda')
const camelize = require('camelize')

const db = require('../../../db/db')
const DbUtils = require('../../../db/dbUtils')

const { getSurveyDBSchema } = require('../../survey/repository/surveySchemaRepositoryUtils')

const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Validation = require('../../../../common/validation/validation')

const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')
const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')

const recordSelectFields = `uuid, owner_uuid, step, cycle, ${DbUtils.selectDate('date_created')}, preview, validation`

const dbTransformCallback = (surveyId, includeValidationFields = true) => record => {
  const validation = Record.getValidation(record)
  return R.pipe(
    R.dissoc(Validation.keys.validation),
    camelize,
    R.assoc('surveyId', surveyId),
    R.assoc(
      Validation.keys.validation,
      includeValidationFields
        ? validation
        : {
          ...Validation.newInstance(Validation.isValid(validation)),
          [Validation.keys.counts]: Validation.getCounts(validation)
        },
    ),
  )(record)
}

// ============== CREATE

const insertRecord = async (surveyId, record, client = db) =>
  await client.one(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.record 
    (owner_uuid, uuid, step, cycle, preview, date_created)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${recordSelectFields}, (SELECT s.uuid AS survey_uuid FROM survey s WHERE s.id = $7)
    `,
    [
      Record.getOwnerUuid(record),
      Record.getUuid(record),
      Record.getStep(record),
      Record.getCycle(record),
      Record.isPreview(record),
      Record.getDateCreated(record) || new Date(),
      surveyId
    ],
    dbTransformCallback(surveyId)
  )

// ============== READ

const countRecordsBySurveyId = async (surveyId, cycle, client = db) =>
  await client.one(`
      SELECT count(*) 
      FROM ${getSurveyDBSchema(surveyId)}.record 
      WHERE preview = FALSE AND cycle = $1
    `,
    [cycle]
  )

const fetchRecordsSummaryBySurveyId = async (surveyId, cycle, nodeDefRoot, nodeDefKeys, offset = 0, limit = null, client = db) => {

  const rootEntityTableAlias = 'n0'
  const getNodeDefKeyColName = NodeDefTable.getColName
  const getNodeDefKeyColAlias = NodeDef.getName
  const nodeDefKeysSelect = nodeDefKeys.map(
    nodeDefKey => `${rootEntityTableAlias}.${getNodeDefKeyColName(nodeDefKey)} as "${getNodeDefKeyColAlias(nodeDefKey)}"`
  ).join(',')

  const recordsSelect = `
    SELECT 
        r.uuid, 
        r.owner_uuid, 
        r.step, 
        ${DbUtils.selectDate('r.date_created', 'date_created')}, 
        r.validation
    FROM ${getSurveyDBSchema(surveyId)}.record r
    WHERE r.preview = FALSE AND r.cycle = ${cycle}
    ORDER BY r.date_created DESC
    LIMIT ${limit ? limit : 'ALL'}
    OFFSET ${offset}
  `

  return await client.map(`
    WITH r AS (${recordsSelect})
    SELECT 
      r.*,
      s.uuid AS survey_uuid,
      n.date_modified,
      u.name as owner_name,
      ${nodeDefKeysSelect}
    FROM  r
    -- GET SURVEY UUID
    JOIN survey s
      ON s.id = $1 
    -- GET OWNER NAME
    JOIN "user" u
      ON r.owner_uuid = u.uuid
    -- GET LAST MODIFIED NODE DATE
    LEFT OUTER JOIN (
         SELECT 
           record_uuid, ${DbUtils.selectDate('MAX(date_modified)', 'date_modified')}
         FROM ${getSurveyDBSchema(surveyId)}.node
         WHERE
           record_uuid IN (select uuid from r)
         GROUP BY record_uuid
    ) as n
      ON r.uuid = n.record_uuid
    -- join with root entity table to get node key values 
    LEFT OUTER JOIN
      ${SchemaRdb.getName(surveyId)}.${NodeDefTable.getViewName(nodeDefRoot)} as ${rootEntityTableAlias}
    ON r.uuid = ${rootEntityTableAlias}.record_uuid
    ORDER BY r.date_created DESC
  `,
    [surveyId],
    dbTransformCallback(surveyId, false)
  )
}

const fetchRecordByUuid = async (surveyId, recordUuid, client = db) =>
  await client.one(
    `SELECT 
     ${recordSelectFields}, (SELECT s.uuid AS survey_uuid FROM survey s WHERE s.id = $2)
     FROM ${getSurveyDBSchema(surveyId)}.record WHERE uuid = $1`,
    [recordUuid, surveyId],
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

const fetchRecordCreatedCountsByDates = async (surveyId, cycle, from, to, client = db) => await client.any(`
    SELECT
      COUNT(r.uuid),
      to_char(date_trunc('day', r.date_created), 'YYYY-MM-DD') AS date
    FROM
      ${getSurveyDBSchema(surveyId)}.record r
    WHERE
      r.date_created BETWEEN $1::DATE AND $2::DATE + INTERVAL '1 day'
    AND 
      r.cycle = $3     
    AND 
      r.preview = FALSE
    GROUP BY
      date_trunc('day', r.date_created)
    ORDER BY
      date_trunc('day', r.date_created)
  `,
  [from, to, cycle]
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

const updateRecordValidationsFromValues = async (surveyId, recordUuidAndValidationValues, client = db) =>
  await client.none(DbUtils.updateAllQuery(
    getSurveyDBSchema(surveyId),
    'record',
    { name: 'uuid', cast: 'uuid' },
    [{ name: 'validation', cast: 'jsonb' }],
    recordUuidAndValidationValues,
  ))

// ============== DELETE

const deleteRecord = async (surveyId, recordUuid, client = db) =>
  await client.query(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.record
    WHERE uuid = $1
    `,
    [recordUuid]
  )

const deleteRecordsPreview = async (surveyId, client = db) =>
  await client.map(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.record
    WHERE preview = $1
    RETURNING uuid
    `,
    [true],
    R.prop('uuid')
  )

const deleteRecordsByCycles = async (surveyId, cycles, client = db) =>
  await client.map(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.record
    WHERE cycle IN ($1:csv)
    RETURNING uuid
  `,
    [cycles],
    R.prop('uuid')
  )

module.exports = {
  // CREATE
  insertRecord,

  // READ
  countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchRecordByUuid,
  fetchRecordUuids,
  fetchRecordCreatedCountsByDates,

  // UPDATE
  updateValidation,
  updateRecordStep,
  updateRecordValidationsFromValues,

  // DELETE
  deleteRecord,
  deleteRecordsPreview,
  deleteRecordsByCycles,
}
