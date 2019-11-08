import * as R from 'ramda'
import { db } from '@server/db/db'
import * as CSVWriter from '@server/utils/file/csvWriter'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as DataTable from '../schemaRdb/dataTable'

import * as RecordRepository from '../../record/repository/recordRepository'
import * as NodeRepository from '../../record/repository/nodeRepository'

import * as SchemaRdbRepository from '../repository/schemaRdbRepository'
import * as DataTableInsertRepository from '../repository/dataTableInsertRepository'
import * as DataTableUpdateRepository from '../repository/dataTableUpdateRepository'
import * as DataTableReadRepository from '../repository/dataTableReadRepository'
import * as DataViewCreateRepository from '../repository/dataViewCreateRepository'
import * as DataViewReadRepository from '../repository/dataViewReadRepository'

// ==== DML
const _getQueryData = async (survey, cycle, nodeDefUuidTable, nodeDefUuidCols = []) => {
  const nodeDefTable = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  return {
    nodeDefTable,
    tableName: NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey)),
    colNames: NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
  }
}

export const queryTable = async (
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
  let rows = await DataViewReadRepository.runSelect(surveyId, cycle, tableName, colNames, offset, limit, filterExpr, sort, !!streamOutput)

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

export const countTable = async (survey, cycle, nodeDefUuidTable, filter) => {
  const surveyId = Survey.getId(survey)
  const { tableName } = await _getQueryData(survey, cycle, nodeDefUuidTable)
  return await DataViewReadRepository.runCount(surveyId, cycle, tableName, filter)
}

export const dropSchema = SchemaRdbRepository.dropSchema
export const createSchema = SchemaRdbRepository.createSchema
export const createTableAndView = DataViewCreateRepository.createTableAndView

export const populateTable = DataTableInsertRepository.populateTable
export const updateTable = DataTableUpdateRepository.updateTable

export const countDuplicateRecords = DataViewReadRepository.countDuplicateRecords
export const fetchRecordsCountByKeys = DataViewReadRepository.fetchRecordsCountByKeys
export const fetchRecordsWithDuplicateEntities = DataTableReadRepository.fetchRecordsWithDuplicateEntities
