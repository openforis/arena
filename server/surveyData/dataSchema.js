const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')

const SurveyManager = require('../survey/surveyManager')
const NodeDefManager = require('../nodeDef/nodeDefManager')

const DataTable = require('./DataTable')
const DataCol = require('./dataCol')

const getSurveyId = R.pipe(Survey.getSurveyInfo, R.prop('id'))

// ==== Schema
const getSchemaName = surveyId => `survey_${surveyId}_data`

const dropSchema = async surveyId =>
  await db.query(`DROP SCHEMA IF EXISTS ${getSchemaName(surveyId)} CASCADE`)

const createSchema = async surveyId =>
  await db.query(`CREATE SCHEMA ${getSchemaName(surveyId)}`)

// ==== Tables

const getTableName = (survey, nodeDef, nodeDefChild = null) => {
  const childName = nodeDefChild ? `_${nodeDefChild.id}` : ''
  return `_${nodeDef.id}${childName}_data`
}

const getTableNameFromSurvey = (survey, nodeDef) =>
  NodeDef.isNodeDefMultiple(nodeDef) && !NodeDef.isNodeDefEntity(nodeDef)
    ? getTableName(survey, Survey.getNodeDefParent(nodeDef)(survey), nodeDef)
    : getTableName(survey, nodeDef)

const createTable = async (survey, nodeDef) => {
  const cols = DataTable.getColumnNamesAndType(survey, nodeDef)

  await db.query(`
    CREATE TABLE
      ${getSchemaName(getSurveyId(survey))}.${getTableNameFromSurvey(survey, nodeDef)}
    (
      id          bigserial NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      ${cols.join(',')},
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

  const updates = await Promise.all(
    R.values(nodes).map(async node => {

      if (node.updated) {
        const nodeDef = nodeDefs[Node.getNodeDefUuid(node)]
        const nodeDefParent = nodeDefs[NodeDef.getNodeDefParentUuid(nodeDef)]
        return {
          colNames: DataCol.getNames(nodeDef),
          colValues: await DataCol.getValues(Survey.getSurveyInfo(survey), nodeDef, node),
          tableName: NodeDef.isNodeDefMultiple(nodeDef)
            ? getTableName(survey, nodeDefParent, nodeDef)
            : getTableName(survey, nodeDefParent),
          rowUuid: NodeDef.isNodeDefMultiple(nodeDef)
            ? node.uuid
            : nodes[Node.getParentUuid(node)].uuid
        }
      }

      return null
    })
  )

  // console.log('=== updates ', JSON.stringify(updates))
  await client.batch(
    R.pipe(
      R.values,
      R.reject(R.isNil),
      R.map(
        update => client.query(`
            UPDATE ${getSchemaName(getSurveyId(survey))}.${update.tableName}
               SET ${update.colNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
               WHERE uuid = $1
            `,
          [update.rowUuid, ...update.colValues]
        )
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