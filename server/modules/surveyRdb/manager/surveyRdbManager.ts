import * as R from 'ramda';
import db from '../../../db/db';
import CSVWriter from '../../../utils/file/csvWriter';

//surveyRdbManger cannot use SurveyManager - circular dependency

import Survey from '../../../../core/survey/survey';

import NodeDef, { INodeDef } from '../../../../core/survey/nodeDef';
import SchemaRdb from '../../../../common/surveyRdb/schemaRdb';
import NodeDefTable from '../../../../common/surveyRdb/nodeDefTable';
import DataTable from '../schemaRdb/dataTable';
import RecordRepository from '../../record/repository/recordRepository';
import NodeRepository from '../../record/repository/nodeRepository';
import NodesInsert from '../dbActions/nodesInsert';
import NodesUpdate from '../dbActions/nodesUpdate';
import TableViewCreate from '../dbActions/tableViewCreate';
import TableViewQuery from '../dbActions/tableViewQuery';
import DataTableRepository from '../dbActions/dataTableRepository';
import { ISortCriteria } from '../../../../common/surveyRdb/dataSort';
import { INodeDefs } from '../../../../core/survey/_survey/surveyNodeDefs';
import { SurveyCycleKey } from '../../../../core/survey/_survey/surveyInfo';

// ==== DDL

const dropSchema = async (surveyId: any, client: any = db) => await client.query(`DROP SCHEMA IF EXISTS ${SchemaRdb.getName(surveyId)} CASCADE`)

const createSchema = async (surveyId: any, client: any = db) => await client.query(`CREATE SCHEMA ${SchemaRdb.getName(surveyId)}`)

const createTable = async (survey: any, nodeDef: any, client: any = db) => await TableViewCreate.run(survey, nodeDef, client)

// ==== DML
const _getQueryData = async (survey: INodeDefs, cycle: SurveyCycleKey, nodeDefUuidTable: string, nodeDefUuidCols: string[] = []) => {
  const nodeDefTable = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  return {
    nodeDefTable,
    tableName: NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey)),
    colNames: NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
  }
}

const queryTable: (
  survey: INodeDefs, cycle: SurveyCycleKey, nodeDefUuidTable: any, nodeDefUuidCols?: string[],
  offset?: number, limit?: any, filterExpr?: any, sort?: ISortCriteria[],
  editMode?: boolean, streamOutput?: any
) => Promise<any>
= async (
  survey, cycle, nodeDefUuidTable, nodeDefUuidCols = [],
  offset = 0, limit = null, filterExpr = null, sort = [],
  editMode = false, streamOutput = null
) => {
  const surveyId = Survey.getId(survey)
  const { nodeDefTable, tableName, colNames: colNamesParams } = await _getQueryData(survey, cycle, nodeDefUuidTable, nodeDefUuidCols)

  // get hierarchy entities uuid col names
  const ancestorUuidColNames: string[] = []
  Survey.visitAncestorsAndSelf(
    nodeDefTable,
    (nodeDefCurrent: INodeDef) => ancestorUuidColNames.push(`${NodeDef.getName(nodeDefCurrent)}_uuid`)
  )(survey)

  // fetch data
  const colNames = [DataTable.colNameRecordUuuid, ...ancestorUuidColNames, ...colNamesParams]
  let rows = await TableViewQuery.runSelect(surveyId, cycle, tableName, colNames, offset, limit, filterExpr, sort, !!streamOutput)

  // edit mode, assoc nodes to columns
  if (editMode) {
    rows = await Promise.all(rows.map(
      async (row: { [x: string]: any; }) => {
        const recordUuid = row[DataTable.colNameRecordUuuid]
        const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid)
        const parentNodeUuid = R.prop(`${NodeDef.getName(nodeDefTable)}_uuid`, row)
        const resultRow = { ...row, cols: {}, record, parentNodeUuid }

        //assoc nodes to each columns
        for (const nodeDefUuidCol of nodeDefUuidCols) {
          const nodeDefCol = Survey.getNodeDefByUuid(nodeDefUuidCol)(survey)
          if (!nodeDefCol) continue;
          const nodeDefColParent = Survey.getNodeDefParent(nodeDefCol)(survey)
          if (!nodeDefColParent) continue;
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
  } else if (streamOutput) {
    await db.stream(
      rows,
      (      stream: { pipe: (arg0: any) => void; }) => {
        stream.pipe(CSVWriter.transformToStream(streamOutput, colNames))
      })
  }

  return rows
}

const countTable = async (survey: any, cycle: SurveyCycleKey, nodeDefUuidTable: any, filter: any) => {
  const surveyId = Survey.getId(survey)
  const { tableName } = await _getQueryData(survey, cycle, nodeDefUuidTable)
  return await TableViewQuery.runCount(surveyId, cycle, tableName, filter)
}

export default {
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
};
