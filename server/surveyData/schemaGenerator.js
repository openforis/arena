const R = require('ramda')
const db = require('../db/db')
const Survey = require('../../common/survey/survey')
const Record = require('../../common/record/record')
const DataTable = require('./nodeDefDataTable')

const getSurveyId = R.pipe(Survey.getSurveyInfo, R.prop('id'))

// ==== Schema
const getSchemaName = surveyId => `survey_${surveyId}_data`

const dropSchema = async surveyId =>
  await db.query(`DROP SCHEMA IF EXISTS ${getSchemaName(surveyId)} CASCADE`)

const createSchema = async surveyId =>
  await db.query(`CREATE SCHEMA ${getSchemaName(surveyId)}`)

// ==== NodeDef Tables

const createNodeDefTable = async (survey, nodeDef) => {

  const nodeDefColumns = DataTable.getNodeDefColumns(survey, nodeDef)
  const sqlColumns = R.flatten(nodeDefColumns.map(DataTable.getColumnsWithType))

  await db.query(`
    CREATE TABLE
      ${getSchemaName(getSurveyId(survey))}.${DataTable.getTableName(survey, nodeDef)}
    (
      id          bigserial NOT NULL,
      uuid        uuid      NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      ${sqlColumns.join(',')},
      PRIMARY KEY (id)
    )
  `)
}

// ==== DATA INSERT

const populateNodeDefTable = async (survey, nodeDef, record) => {

  const nodeDefColumns = DataTable.getNodeDefColumns(survey, nodeDef)

  const columnNames = ['uuid', ...R.flatten(nodeDefColumns.map(DataTable.getColumnNames))]
  const rowValues = (node) => {
    const v = [
      node.uuid,
      ...R.flatten(
        nodeDefColumns.map(nodeDef =>
          DataTable.getColumnValues(survey, nodeDef, record, node)
        )
      )
    ]
    return v
  }
  const nodes = Record.getNodesByDefUuid(nodeDef.uuid)(record)

  await db.tx(async t => await t.batch(
    nodes.map(node => t.query(`
      INSERT INTO 
        ${getSchemaName(getSurveyId(survey))}.${DataTable.getTableName(survey, nodeDef)}
        (${columnNames.join(',')})
      VALUES 
        (${columnNames.map((nodeDef, i) => `$${i + 1}`).join(',')})
      `,
      [...rowValues(node)]
    ))
  ))
}

module.exports = {
  dropSchema,
  createSchema,
  createNodeDefTable,

  populateNodeDefTable,
}