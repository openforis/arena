const R = require('ramda')
const db = require('../../../db/db')
const CSVWriter = require('../../../utils/file/csvWriter')
//surveyRdbManger cannot use SurveyManager - circular dependency

const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')
const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')
const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')
const DataTable = require('../schemaRdb/dataTable')

const RecordRepository = require('../../record/repository/recordRepository')
const NodeRepository = require('../../record/repository/nodeRepository')

const NodesInsert = require('../dbActions/nodesInsert')
const NodesUpdate = require('../dbActions/nodesUpdate')
const TableViewCreate = require('../dbActions/tableViewCreate')
const TableViewQuery = require('../dbActions/tableViewQuery')
const DataTableRepository = require('../dbActions/dataTableRepository')

// ==== DDL

const dropSchema = async (surveyId, client = db) => await client.query(`DROP SCHEMA IF EXISTS ${SchemaRdb.getName(surveyId)} CASCADE`)

const createSchema = async (surveyId, client = db) => await client.query(`CREATE SCHEMA ${SchemaRdb.getName(surveyId)}`)

const createTable = async (survey, nodeDef, client = db) => await TableViewCreate.run(survey, nodeDef, client)

// ==== DML
const _getQueryData = async (survey, cycle, nodeDefUuidTable, nodeDefUuidCols = []) => {
  const nodeDefTable = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  return {
    nodeDefTable,
    tableName: NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey)),
    colNames: NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
  }
}

const queryTable = async (
  survey, cycle, nodeDefUuidTable, nodeDefUuidCols = [],
  offset = 0, limit = null, filterExpr = null, sort = [],
  editMode = false, streamOutput = null
) => {
  const surveyId = Survey.getId(survey)
  const { nodeDefTable, tableName, colNames: colNamesParams } = await _getQueryData(survey, cycle, nodeDefUuidTable, nodeDefUuidCols)

  // get hierarchy entities uuid col names
  const ancestorUuidColNames = []
  Survey.visitAncestorsAndSelf(
    nodeDefTable,
    nodeDefCurrent => ancestorUuidColNames.push(`${NodeDef.getName(nodeDefCurrent)}_uuid`)
  )(survey)

  // fetch data
  const colNames = [DataTable.colNameRecordUuuid, ...ancestorUuidColNames, ...colNamesParams]
  let rows = await TableViewQuery.runSelect(surveyId, cycle, tableName, colNames, offset, limit, filterExpr, sort, !!streamOutput)

  // edit mode, assoc nodes to columns
  if (editMode) {
    rows = await Promise.all(rows.map(
      async row => {
        const recordUuid = row[DataTable.colNameRecordUuuid]
        const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid)
        const parentNodeUuid = R.prop(`${NodeDef.getName(nodeDefTable)}_uuid`, row)
        const resultRow = { ...row, cols: {}, record, parentNodeUuid }

        //assoc nodes to each columns
        for (const nodeDefUuidCol of nodeDefUuidCols) {
          const nodeDefCol = Survey.getNodeDefByUuid(nodeDefUuidCol)(survey)
          const nodeDefColParent = Survey.getNodeDefParent(nodeDefCol)(survey)
          const parentUuidColName = `${NodeDef.getName(nodeDefColParent)}_uuid`
          const parentUuid = R.prop(parentUuidColName, row)

          const node = NodeDef.isMultiple(nodeDefTable) && NodeDef.isEqual(nodeDefCol)(nodeDefTable) // column is the multiple attribute
            ? await NodeRepository.fetchNodeByUuid(surveyId, row[`${NodeDef.getName(nodeDefCol)}_uuid`])
            : (await NodeRepository.fetchChildNodesByNodeDefUuids(surveyId, recordUuid, parentUuid, [nodeDefUuidCol]))[0]

          resultRow.cols[nodeDefUuidCol] = { parentUuid, node }
        }

        return resultRow
      }
    ))
  } else if (!!streamOutput) {
    await db.stream(
      rows,
      stream => {
        stream.pipe(CSVWriter.transformToStream(streamOutput, colNames))
      })
  }

  return rows
}

const countTable = async (survey, cycle, nodeDefUuidTable, filter) => {
  const surveyId = Survey.getId(survey)
  const { tableName } = await _getQueryData(survey, cycle, nodeDefUuidTable)
  return await TableViewQuery.runCount(surveyId, cycle, tableName, filter)
}

module.exports = {
  dropSchema,
  createSchema,
  createTable,

  insertIntoTable: NodesInsert.run,
  updateTableNodes: NodesUpdate.run,

  queryTable,
  countTable,
  countDuplicateRecords: TableViewQuery.countDuplicateRecords,
  fetchRecordsCountByKeys: TableViewQuery.fetchRecordsCountByKeys,
  fetchRecordsWithDuplicateEntities: DataTableRepository.fetchRecordsWithDuplicateEntities,
}