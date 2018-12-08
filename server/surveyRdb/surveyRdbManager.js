const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')

const SurveyManager = require('../survey/surveyManager')
const NodeDefManager = require('../nodeDef/nodeDefManager')

const DataTable = require('./dataTable')
const NodeUpdate = require('./nodeUpdate')

const getSurveyId = R.pipe(Survey.getSurveyInfo, R.prop('id'))

// ==== Schema
const getSchemaName = surveyId => `survey_${surveyId}_data`

const dropSchema = async surveyId =>
  await db.query(`DROP SCHEMA IF EXISTS ${getSchemaName(surveyId)} CASCADE`)

const createSchema = async surveyId =>
  await db.query(`CREATE SCHEMA ${getSchemaName(surveyId)}`)

// ==== Tables

const createTable = async (survey, nodeDef) => {
  const cols = DataTable.getColumnNamesAndType(survey, nodeDef)

  const surveyId = getSurveyId(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const schemaName = getSchemaName(surveyId)

  await db.query(`
    CREATE TABLE
      ${schemaName}.${DataTable.getTableName(nodeDef, nodeDefParent)}
    (
      id          bigserial NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      ${cols.join(',')},
      CONSTRAINT ${NodeDef.getNodeDefName(nodeDef)}_uuid_unique_ix1 UNIQUE (uuid),
      ${DataTable.getParentForeignKey(surveyId, schemaName, nodeDef, nodeDefParent)},
      PRIMARY KEY (id)
    )
  `)
}

const insertIntoTable = async (survey, nodeDef, record) => {
  const columnNames = DataTable.getColumnNames(survey, nodeDef)
  const nodes = Record.getNodesByDefUuid(nodeDef.uuid)(record)
  const nodeValues = await Promise.all(nodes.map(async node =>
    await DataTable.getRowValues(survey, nodeDef, record, node)
  ))
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  await db.tx(async t => await t.batch(
    nodeValues.map(nodeValue => t.query(`
      INSERT INTO 
        ${getSchemaName(getSurveyId(survey))}.${DataTable.getTableName(nodeDef, nodeDefParent)}
        (${columnNames.join(',')})
      VALUES 
        (${columnNames.map((_, i) => `$${i + 1}`).join(',')})
      `,
      [...nodeValue]
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
            `UPDATE ${getSchemaName(getSurveyId(survey))}.${update.tableName}
               SET ${update.colNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
               WHERE uuid = $1`,
            [update.rowUuid, ...update.colValues]
          )
        )
        : NodeUpdate.isInsert(update)
        ? (
          client.query(
            `INSERT INTO ${getSchemaName(getSurveyId(survey))}.${update.tableName}
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
              `DELETE FROM ${getSchemaName(getSurveyId(survey))}.${update.tableName}
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