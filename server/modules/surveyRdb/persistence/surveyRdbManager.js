const db = require('../../../db/db')
//surveyRdbManger cannot use SurveyManager - circular dependency

const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')

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

const insertIntoTable = async (survey, nodeDef, records, client = db) =>
  await NodesInsert.run(survey, nodeDef, records, client)

const updateTableNodes = async (surveyInfo, nodeDefs, nodes, client = db) =>
  await NodesUpdate.run(surveyInfo, nodeDefs, nodes, client)

const queryTable = async (surveyId, tableName, cols = [],
                          offset, limit, filterExpr, sort, client = db) =>
  await TableViewQuery.runSelect(surveyId, tableName, cols, offset, limit, filterExpr, null, sort, client)

const countTable = async (surveyId, tableName, filter, client = db) =>
  await TableViewQuery.runCount(surveyId, tableName, filter, client)

const queryRootTableByRecordKeys = async (survey, recordUuid, client = db) =>
  await TableViewQuery.queryRootTableByRecordKeys(survey, recordUuid, client)

module.exports = {
  dropSchema,
  createSchema,
  createTable,

  insertIntoTable,
  updateTableNodes,

  queryTable,
  countTable,
  queryRootTableByRecordKeys,
}