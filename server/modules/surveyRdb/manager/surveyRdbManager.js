const db = require('../../../db/db')
//surveyRdbManger cannot use SurveyManager - circular dependency

const SchemaRdb = require('../../../../core/surveyRdb/schemaRdb')

const NodesInsert = require('../dbActions/nodesInsert')
const NodesUpdate = require('../dbActions/nodesUpdate')
const TableViewCreate = require('../dbActions/tableViewCreate')
const TableViewQuery = require('../dbActions/tableViewQuery')
const DataTableRepository = require('../dbActions/dataTableRepository')

// ==== DDL

const dropSchema = async (surveyId, client = db) =>
  await client.query(`DROP SCHEMA IF EXISTS ${SchemaRdb.getName(surveyId)} CASCADE`)

const createSchema = async (surveyId, client = db) =>
  await client.query(`CREATE SCHEMA ${SchemaRdb.getName(surveyId)}`)

const createTable = async (survey, nodeDef, client = db) =>
  await TableViewCreate.run(survey, nodeDef, client)

// ==== DML

const insertIntoTable = async (survey, nodeDef, client = db) =>
  await NodesInsert.run(survey, nodeDef, client)

module.exports = {
  dropSchema,
  createSchema,
  createTable,

  insertIntoTable,
  updateTableNodes: NodesUpdate.run,

  queryTable: TableViewQuery.runSelect,
  countTable: TableViewQuery.runCount,
  countDuplicateRecords: TableViewQuery.countDuplicateRecords,
  fetchRecordsCountByKeys: TableViewQuery.fetchRecordsCountByKeys,
  fetchRecordsWithDuplicateEntities: DataTableRepository.fetchRecordsWithDuplicateEntities,
}