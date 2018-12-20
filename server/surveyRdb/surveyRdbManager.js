const db = require('../db/db')
//surveyRdbManger cannot use SurveyManager - loop dependencies

const DataSchema = require('./schemaRdb/dataSchema')
const NodesInsert = require('./dbActions/nodesInsert')
const NodesUpdate = require('./dbActions/nodesUpdate')
const TableViewCreate = require('./dbActions/tableViewCreate')
const TableViewQuery = require('./dbActions/tableViewQuery')

// ==== DDL

const dropSchema = async (surveyId, client = db) =>
  await client.query(`DROP SCHEMA IF EXISTS ${DataSchema.getName(surveyId)} CASCADE`)

const createSchema = async (surveyId, client = db) =>
  await client.query(`CREATE SCHEMA ${DataSchema.getName(surveyId)}`)

const createTable = async (survey, nodeDef, client = db) =>
  await TableViewCreate.run(survey, nodeDef, client)

// ==== DML

const insertIntoTable = async (survey, nodeDef, record, client = db) =>
  await NodesInsert.run(survey, nodeDef, record, client)

const updateTableNodes = async (surveyInfo, nodeDefs, nodes, client = db) =>
  await NodesUpdate.run(surveyInfo, nodeDefs, nodes, client)

const queryTable = async (surveyId, tableName, cols = [],
                          offset = 0, limit = 20, client = db) =>
  await TableViewQuery.runSelect(surveyId, tableName, cols, offset, limit, client)

const countTable = async (surveyId, tableName, client = db) =>
  await TableViewQuery.runCount(surveyId, tableName, client)

module.exports = {
  dropSchema,
  createSchema,
  createTable,

  insertIntoTable,
  updateTableNodes,
  queryTable,
  countTable,
}