const R = require('ramda')
const fastcsv = require('fast-csv')

const db = require('../db/db')
//surveyRdbManger cannot use SurveyManager - loop dependencies

const SchemaRdb = require('../../common/surveyRdb/schemaRdb')

const NodesInsert = require('./dbActions/nodesInsert')
const NodesUpdate = require('./dbActions/nodesUpdate')
const TableViewCreate = require('./dbActions/tableViewCreate')
const TableViewQuery = require('./dbActions/tableViewQuery')

// ==== DDL

const dropSchema = async (surveyId, client = db) =>
  await client.query(`DROP SCHEMA IF EXISTS ${SchemaRdb.getName(surveyId)} CASCADE`)

const createSchema = async (surveyId, client = db) =>
  await client.query(`CREATE SCHEMA ${SchemaRdb.getName(surveyId)}`)

const createTable = async (survey, nodeDef, client = db) =>
  await TableViewCreate.run(survey, nodeDef, client)

// ==== DML

const insertIntoTable = async (survey, nodeDef, record, client = db) =>
  await NodesInsert.run(survey, nodeDef, record, client)

const updateTableNodes = async (surveyInfo, nodeDefs, nodes, client = db) =>
  await NodesUpdate.run(surveyInfo, nodeDefs, nodes, client)

const queryTable = async (surveyId, tableName, cols = [],
                          offset, limit, filter, client = db) =>
  await TableViewQuery.runSelect(surveyId, tableName, cols, offset, limit, filter, client)

const countTable = async (surveyId, tableName, filter, client = db) =>
  await TableViewQuery.runCount(surveyId, tableName, filter, client)

const queryRootTableByRecordKeys = async (survey, recordUuid, client = db) =>
  await TableViewQuery.queryRootTableByRecordKeys(survey, recordUuid, client)

const exportTableToCSV = async (surveyId, tableName, cols, filter, output) => {
  const csvStream = fastcsv.createWriteStream({ headers: true })
  csvStream.pipe(output)

  // 1. write headers
  csvStream.write(cols)

  let offset = 0
  const limit = 10
  let complete = false

  // 2. write rows
  while (!complete) {
    const rows = await queryTable(surveyId, tableName, cols, offset, limit, filter)

    rows.forEach(row => {
      csvStream.write(R.values(row))
    })

    offset = offset + limit
    if (rows.length < limit)
      complete = true
  }

  // 3. close stream
  csvStream.end()
}

module.exports = {
  dropSchema,
  createSchema,
  createTable,

  insertIntoTable,
  updateTableNodes,

  queryTable,
  countTable,
  queryRootTableByRecordKeys,
  exportTableToCSV,
}