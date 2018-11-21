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

const fetchRecordsSummaryBySurveyId = async (surveyId, offset, limit, client = db) => {

  // fetch nodeDef keys
  const nodeDefKeys = await client.any(`
    SELECT id, props->>'name' as name 
    FROM node_def n      
    WHERE n.survey_id = $1
    AND props->>'key' = $2
  `,
    [surveyId, 'true']
  )

  // select nodeDef keys
  const keyNames = nodeDefKeys.map((nodeDefKey, i) => camelize(nodeDefKey.name))

  // select nodeDef key values
  const nodeDefKeyValues = nodeDefKeys.map((nodeDefKey, i) => `
    n${i}.value as ${nodeDefKey.name} 
  `).join(', ')

  // join with node key values
  const nodeDefKeyJoins = nodeDefKeys.map((nodeDefKey, i) => `
    LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.node as n${i}
      ON r.id = n${i}.record_id
      AND n${i}.node_def_id = ${nodeDefKey.id}
  `).join(' ')

  return await client.map(`
    SELECT 
      r.id, r.uuid, r.owner_id, r.step, ${selectDate('r.date_created', 'date_created')},
      n.date_modified,
      u.name as owner_name,
      '${JSON.stringify(keyNames)}' as keys
      ${R.isEmpty(keyNames) ? '' : ',' + nodeDefKeyValues}
    FROM ${getSurveyDBSchema(surveyId)}.record r
    -- GET OWNER NAME
    JOIN "user" u
      ON r.owner_id = u.id
    -- GET LAST MODIFIED NODE DATE
    JOIN (
         SELECT 
           record_id, ${selectDate('MAX(date_modified)', 'date_modified')}
         FROM ${getSurveyDBSchema(surveyId)}.node
         GROUP BY record_id
    ) as n
      ON r.id = n.record_id
    ${R.isEmpty(keyNames) ? '' : nodeDefKeyJoins}
    ORDER BY r.id DESC
    LIMIT $1
    OFFSET $2
  `,
    [limit, offset],
    dbTransformCallback(surveyId)
  )
}

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
  fetchRecordsSummaryBySurveyId,
  fetchRecordById,

  //UPDATE
}