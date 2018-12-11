const db = require('../db/db')
const Survey = require('../../common/survey/survey')
const Node = require('../../common/record/node')

const SurveyManager = require('../survey/surveyManager')
const NodeDefManager = require('../nodeDef/nodeDefManager')

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

const updateTableNodes = async (surveyId, nodes, client = db) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId, false, false, client)
  const nodeDefs = await NodeDefManager.fetchNodeDefsByUuid(surveyId, Node.getNodeDefUuids(nodes), false, false, client)
  await NodesUpdate.run(Survey.getSurveyInfo(survey), nodes, nodeDefs, client)
}

const queryTable = async (surveyId, tableName, cols = [],
                          offset = 0, limit = 20, client = db) =>
  await TableViewQuery.run(surveyId, tableName, cols, offset, limit, client)

module.exports = {
  dropSchema,
  createSchema,
  createTable,

  insertIntoTable,
  updateTableNodes,
  queryTable,
}