const R = require('ramda')
const camelize = require('camelize')

const {selectDate} = require('../db/dbUtils')

let inMemoryRecord = null

// ============== CREATE

const insertRecord = (surveyId, record) => {
  inMemoryRecord = record
  // TODO add missing fields
  return record
}
// await client.one(`
//   INSERT INTO ${getSurveyDBSchema(surveyId)}.record
//   (owner_id, uuid, step)
//   VALUES ($1, $2, $3)
//   RETURNING ${recordSelectFields}`,
//   [record.ownerId, record.uuid, record.step],
//   dbTransformCallback(surveyId)
// )

// ============== READ

// const countRecordsBySurveyId = async (surveyId, client = db) =>
//   await client.one(`SELECT count(*) FROM ${getSurveyDBSchema(surveyId)}.record`)

// const fetchRecordsSummaryBySurveyId = async (surveyId, nodeDefKeys, offset = 0, limit = null, client = db) => {
//   // select nodeDef key values
//   const nodeDefKeyValues = nodeDefKeys.map((nodeDefKey, i) => `
//     n${i}.value as "${NodeDef.getNodeDefName(nodeDefKey)}"
//   `).join(', ')
//
//   // join with node key values
//   const nodeDefKeyJoins = nodeDefKeys.map((nodeDefKey, i) => `
//     LEFT OUTER JOIN ${getSurveyDBSchema(surveyId)}.node as n${i}
//       ON r.uuid = n${i}.record_uuid
//       AND n${i}.node_def_uuid = '${nodeDefKey.uuid}'
//   `).join(' ')
//
//   return await client.map(`
//     SELECT
//       r.id, r.uuid, r.owner_id, r.step, ${selectDate('r.date_created', 'date_created')},
//       n.date_modified,
//       u.name as owner_name
//       ${R.isEmpty(nodeDefKeys) ? '' : ',' + nodeDefKeyValues}
//     FROM ${getSurveyDBSchema(surveyId)}.record r
//     -- GET OWNER NAME
//     JOIN "user" u
//       ON r.owner_id = u.id
//     -- GET LAST MODIFIED NODE DATE
//     LEFT OUTER JOIN (
//          SELECT
//            record_uuid, ${selectDate('MAX(date_modified)', 'date_modified')}
//          FROM ${getSurveyDBSchema(surveyId)}.node
//          GROUP BY record_uuid
//     ) as n
//       ON r.uuid = n.record_uuid
//     ${R.isEmpty(nodeDefKeys) ? '' : nodeDefKeyJoins}
//     ORDER BY r.id DESC
//     LIMIT ${limit ? limit : 'ALL'}
//     OFFSET ${offset}
//   `,
//     [],
//     dbTransformCallback(surveyId)
//   )
// }

const fetchRecordByUuid = (surveyId, recordUuid) => inMemoryRecord
// const fetchRecordByUuid = async (surveyId, recordUuid, client = db) =>
//   await client.one(
//     `SELECT
//      ${recordSelectFields}
//      FROM ${getSurveyDBSchema(surveyId)}.record WHERE uuid = $1`,
//     [recordUuid],
//     dbTransformCallback(surveyId)
//   )

// // ============== DELETE
// const deleteRecord = async (user, surveyId, recordUuid, client = db) =>
//   await client.query(`
//     DELETE FROM ${getSurveyDBSchema(surveyId)}.record
//     WHERE uuid = $1
//     `,
//     [recordUuid]
//   )

module.exports = {
  // CREATE
  insertRecord,

  // READ
  // countRecordsBySurveyId,
  // fetchRecordsSummaryBySurveyId,
  fetchRecordByUuid,

  // UPDATE

  // DELETE
  // deleteRecord,
}
