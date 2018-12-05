const R = require('ramda')
const Promise = require('bluebird')

const db = require('../db/db')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const DataTable = require('./DataTable')

const getSurveyId = R.pipe(Survey.getSurveyInfo, R.prop('id'))

const getSchemaName = surveyId => `survey_${surveyId}_data`

const getTableName = (survey, nodeDef) => {
  const prefix = NodeDef.isNodeDefEntity(nodeDef)
    ? nodeDef.id
    : `${Survey.getNodeDefParent(nodeDef)(survey).id}_${nodeDef.id}`

  return `_${prefix}_data`
}

// ==== Schema

const dropSchema = async surveyId =>
  await db.query(`DROP SCHEMA IF EXISTS ${getSchemaName(surveyId)} CASCADE`)

const createSchema = async surveyId =>
  await db.query(`CREATE SCHEMA ${getSchemaName(surveyId)}`)

// ==== Tables

const createTable = async (survey, nodeDef) => {
  const cols = DataTable.getColumnNamesAndType(survey, nodeDef)

  await db.query(`
    CREATE TABLE
      ${getSchemaName(getSurveyId(survey))}.${getTableName(survey, nodeDef)}
    (
      id          bigserial NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      ${cols.join(',')},
      PRIMARY KEY (id)
    )
  `)
}

// ==== DATA INSERT

const insertIntoTable = async (survey, nodeDef, record) => {

  const columnNames = DataTable.getColumnNames(survey, nodeDef)

  const nodes = Record.getNodesByDefUuid(nodeDef.uuid)(record)

  const nodeValues = await Promise.all(nodes.map(async node =>
    await DataTable.getRowValues(survey, nodeDef, record, node)
  ))

  await db.tx(async t => await t.batch(
    nodeValues.map(nodeValue => t.query(`
      INSERT INTO 
        ${getSchemaName(getSurveyId(survey))}.${getTableName(survey, nodeDef)}
        (${columnNames.join(',')})
      VALUES 
        (${columnNames.map((nodeDef, i) => `$${i + 1}`).join(',')})
      `,
      [...nodeValue]
    ))
  ))

}

module.exports = {
  dropSchema,
  createSchema,

  createTable,
  insertIntoTable,
}