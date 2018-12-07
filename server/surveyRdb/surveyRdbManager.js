const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')
const Survey = require('../../common/survey/survey')
const SurveyUtils = require('../../common/survey/surveyUtils')
const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')

const SurveyManager = require('../survey/surveyManager')
const NodeDefManager = require('../nodeDef/nodeDefManager')

const DataTable = require('./dataTable')
const DataCol = require('./dataCol')

const getSurveyId = R.pipe(Survey.getSurveyInfo, R.prop('id'))

// ==== Schema
const getSchemaName = surveyId => `survey_${surveyId}_data`

const dropSchema = async surveyId =>
  await db.query(`DROP SCHEMA IF EXISTS ${getSchemaName(surveyId)} CASCADE`)

const createSchema = async surveyId =>
  await db.query(`CREATE SCHEMA ${getSchemaName(surveyId)}`)

// ==== Tables

const getTableNameFromSurvey = (survey, nodeDef) =>
  NodeDef.isNodeDefMultiple(nodeDef) && !NodeDef.isNodeDefEntity(nodeDef)
    ? DataTable.getTableName(Survey.getNodeDefParent(nodeDef)(survey), nodeDef)
    : DataTable.getTableName(nodeDef)

const createTable = async (survey, nodeDef) => {
  const cols = DataTable.getColumnNamesAndType(survey, nodeDef)

  const surveyId = getSurveyId(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const schemaName = getSchemaName(surveyId)
  const tableName = getTableNameFromSurvey(survey, nodeDef)

  await db.query(`
    CREATE TABLE
      ${schemaName}.${tableName}
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

  await db.tx(async t => await t.batch(
    nodeValues.map(nodeValue => t.query(`
      INSERT INTO 
        ${getSchemaName(getSurveyId(survey))}.${getTableNameFromSurvey(survey, nodeDef)}
        (${columnNames.join(',')})
      VALUES 
        (${columnNames.map((nodeDef, i) => `$${i + 1}`).join(',')})
      `,
      [...nodeValue]
    ))
  ))

}

const updateTableNodes = async (surveyId, nodes, client = db) => {
  const nodeDefUuids = R.pipe(
    R.keys,
    R.map(key => Node.getNodeDefUuid(nodes[key])),
    R.uniq
  )(nodes)

  const survey = await SurveyManager.fetchSurveyById(surveyId)
  const nodeDefs = await NodeDefManager.fetchNodeDefsByUuid(surveyId, nodeDefUuids)

  const types = {insert: 'insert', update: 'update', delete: 'delete'}

  const updates = await Promise.all(
    R.values(nodes).map(async node => {

      const nodeDef = nodeDefs[Node.getNodeDefUuid(node)]
      const nodeDefParent = nodeDefs[NodeDef.getNodeDefParentUuid(nodeDef)]
      const nodeParent = nodes[Node.getParentUuid(node)]

      const isMultiple = NodeDef.isNodeDefMultiple(nodeDef)
      const isEntity = NodeDef.isNodeDefEntity(nodeDef)
      const isRoot = NodeDef.isNodeDefRoot(nodeDef)
      const hasTable = isEntity || isMultiple

      const type = node.created && hasTable
        ? types.insert
        : node.updated || node.created
          ? types.update
          : node.deleted && hasTable
            ? types.delete
            : node.deleted
              ? types.update
              : null

      return type ? {
        type,
        tableName: isEntity
          ? DataTable.getTableName(nodeDef)
          : isMultiple
            ? DataTable.getTableName(nodeDefParent, nodeDef)
            : DataTable.getTableName(nodeDefParent),

        colNames: type === types.insert
          ? [DataTable.colNameUuuid, isRoot ? DataTable.colNameRecordUuuid : DataTable.colNameParentUuuid]
          : DataCol.getNames(nodeDef),

        colValues: type === types.insert
          ? [SurveyUtils.getUuid(node), isRoot ? Node.getRecordUuid(node) : Node.getParentUuid(node)]
          : await DataCol.getValues(Survey.getSurveyInfo(survey), nodeDef, node),

        rowUuid: hasTable
          ? node.uuid
          : nodeParent.uuid
      } : null
    })
  )

  await client.batch(
    R.pipe(
      R.reject(R.isNil),
      R.map(update =>
        update.type === types.update
          ? (
            client.query(
              `UPDATE ${getSchemaName(getSurveyId(survey))}.${update.tableName}
               SET ${update.colNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
               WHERE uuid = $1`,
              [update.rowUuid, ...update.colValues]
            )
          )
          : update.type === types.insert
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
          : update.type === types.delete
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
    )(updates)
  )

}

module.exports = {
  dropSchema,
  createSchema,

  createTable,
  insertIntoTable,

  updateTableNodes,
}