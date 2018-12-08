const db = require('../db/db')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Node = require('../../common/record/node')

const SurveyManager = require('../survey/surveyManager')
const NodeDefManager = require('../nodeDef/nodeDefManager')

const DataSchema = require('./schemaRdb/dataSchema')
const DataTable = require('./schemaRdb/dataTable')
const NodeInsert = require('./nodeInsert')
const NodeUpdate = require('./nodeUpdate')

// ==== Schema
const dropSchema = async surveyId => await db.query(`DROP SCHEMA IF EXISTS ${DataSchema.getName(surveyId)} CASCADE`)

const createSchema = async surveyId => await db.query(`CREATE SCHEMA ${DataSchema.getName(surveyId)}`)

// ==== Tables

const createTable = async (survey, nodeDef) => {

  const surveyId = Survey.getSurveyInfo(survey).id
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const schemaName = DataSchema.getName(surveyId)
  const tableName = DataTable.getTableName(nodeDef, nodeDefParent)
  const cols = DataTable.getColumnNamesAndType(survey, nodeDef)
  const parentForeignKey = DataTable.getParentForeignKey(surveyId, schemaName, nodeDef, nodeDefParent)
  const uuidUniqueIdx = `CONSTRAINT ${NodeDef.getNodeDefName(nodeDef)}_uuid_unique_ix1 UNIQUE (uuid)`

  await db.query(`
    CREATE TABLE
      ${schemaName}.${tableName}
    (
      id          bigserial NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      ${cols.join(',')},
      ${uuidUniqueIdx},
      ${parentForeignKey},
      PRIMARY KEY (id)
    )
  `)
}
const insertIntoTable = async (survey, nodeDef, record) => {
  const inserts = await NodeInsert.toInserts(survey, nodeDef, record)

  await db.tx(async t => await t.batch(
    inserts.map(insert => t.query(`
      INSERT INTO
        ${insert.schemaName}.${insert.tableName}
        (${insert.colNames.join(',')})
      VALUES
        (${insert.colNames.map((_, i) => `$${i + 1}`).join(',')})
      `,
      insert.values
    ))
  ))

}

const updateTableNodes = async (surveyId, nodes, client = db) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId)
  const nodeDefs = await NodeDefManager.fetchNodeDefsByUuid(surveyId, Node.getNodeDefUuids(nodes))
  const updates = await NodeUpdate.toUpdates(Survey.getSurveyInfo(survey), nodes, nodeDefs)

  await client.batch(
    updates.map(update =>
      NodeUpdate.isUpdate(update)
        ? (
          client.query(
            `UPDATE ${update.schemaName}.${update.tableName}
               SET ${update.colNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
               WHERE uuid = $1`,
            [update.rowUuid, ...update.colValues]
          )
        )
        : NodeUpdate.isInsert(update)
        ? (
          client.query(
            `INSERT INTO ${update.schemaName}.${update.tableName}
                   (${update.colNames.join(',')})
                   VALUES 
                   (${update.colNames.map((col, i) => `$${i + 1}`).join(',')})
                  `,
            update.colValues
          )
        )
        : NodeUpdate.isDelete(update)
          ? (
            client.query(
              `DELETE FROM ${update.schemaName}.${update.tableName}
                   WHERE uuid = $1
                  `,
              update.rowUuid
            )
          )
          : null
    )
  )

}

module.exports = {
  dropSchema,
  createSchema,

  createTable,
  insertIntoTable,

  updateTableNodes,
}