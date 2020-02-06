import * as R from 'ramda'
import { db } from '@server/db/db'
import * as CSVWriter from '@server/utils/file/csvWriter'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ResultStepView from '@common/surveyRdb/resultStepView'
import * as DataTable from '../schemaRdb/dataTable'

import * as ProcessingChainRepository from '@server/modules/analysis/repository/processingChainRepository'
import * as ProcessingStepRepository from '@server/modules/analysis/repository/processingStepRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as NodeRepository from '@server/modules/record/repository/nodeRepository'

import * as DataTableInsertRepository from '../repository/dataTableInsertRepository'
import * as DataTableUpdateRepository from '../repository/dataTableUpdateRepository'
import * as DataTableReadRepository from '../repository/dataTableReadRepository'
import * as DataViewReadRepository from '../repository/dataViewReadRepository'

// ==== DDL

// schema
export { createSchema, dropSchema, grantSelectToUserAnalysis } from '../repository/schemaRdbRepository'

// Data tables and views
export { createTableAndView } from '../repository/dataViewCreateRepository'

// Node key views
export { createNodeKeysView } from '../repository/nodeKeysViewRepository'
export { createNodeHierarchyDisaggregatedView } from '../repository/nodeHierarchyDisaggregatedViewRepository'
export { createNodeKeysHierarchyView } from '../repository/nodeKeysHierarchyViewRepository'

// Result tables and views
export { createResultNodeTable, grantWriteToUserAnalysis } from '../repository/resultNodeTableRepository'
export { createResultStepView } from '../repository/resultStepViewRepository'

// ==== DML

const _getQueryData = async (survey, nodeDefUuidTable, nodeDefUuidCols = []) => {
  const nodeDefTable = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  return {
    nodeDefTable,
    tableName: NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey)),
    colNames: NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey),
  }
}

export const queryTable = async (
  survey,
  cycle,
  nodeDefUuidTable,
  nodeDefUuidCols = [],
  offset = 0,
  limit = null,
  filterExpr = null,
  sort = [],
  editMode = false,
  streamOutput = null,
) => {
  const surveyId = Survey.getId(survey)
  const { nodeDefTable, tableName, colNames: colNamesParams } = await _getQueryData(
    survey,
    nodeDefUuidTable,
    nodeDefUuidCols,
  )

  // Get hierarchy entities uuid col names
  const ancestorUuidColNames = []
  Survey.visitAncestorsAndSelf(nodeDefTable, nodeDefCurrent => {
    // Skip virtual entity: ancestor uuid column taken from its parent entity def
    if (!NodeDef.isVirtual(nodeDefCurrent)) {
      ancestorUuidColNames.push(`${NodeDef.getName(nodeDefCurrent)}_uuid`)
    }
  })(survey)

  // Fetch data
  const colNames = [DataTable.colNameRecordUuuid, ...ancestorUuidColNames, ...colNamesParams]
  let rows = await DataViewReadRepository.runSelect(
    surveyId,
    cycle,
    tableName,
    colNames,
    offset,
    limit,
    filterExpr,
    sort,
    Boolean(streamOutput),
  )

  // Edit mode, assoc nodes to columns
  if (editMode) {
    rows = await Promise.all(
      rows.map(async row => {
        const recordUuid = row[DataTable.colNameRecordUuuid]
        const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid)
        const parentNodeUuid = R.prop(`${NodeDef.getName(nodeDefTable)}_uuid`, row)
        const resultRow = { ...row, cols: {}, record, parentNodeUuid }

        // Assoc nodes to each columns
        for (const nodeDefUuidCol of nodeDefUuidCols) {
          const nodeDefCol = Survey.getNodeDefByUuid(nodeDefUuidCol)(survey)
          const nodeDefColParent = Survey.getNodeDefParent(nodeDefCol)(survey)
          const parentUuidColName = `${NodeDef.getName(nodeDefColParent)}_uuid`
          const parentUuid = R.prop(parentUuidColName, row)

          const node =
            NodeDef.isMultiple(nodeDefTable) && NodeDef.isEqual(nodeDefCol)(nodeDefTable) // Column is the multiple attribute
              ? await NodeRepository.fetchNodeByUuid(surveyId, row[`${NodeDef.getName(nodeDefCol)}_uuid`])
              : (
                  await NodeRepository.fetchChildNodesByNodeDefUuids(surveyId, recordUuid, parentUuid, [nodeDefUuidCol])
                )[0]

          resultRow.cols[nodeDefUuidCol] = { parentUuid, node }
        }

        return resultRow
      }),
    )
  } else if (streamOutput) {
    await db.stream(rows, stream => {
      stream.pipe(CSVWriter.transformToStream(streamOutput, colNames))
    })
  }

  return rows
}

export const countTable = async (survey, cycle, nodeDefUuidTable, filter) => {
  const surveyId = Survey.getId(survey)
  const { tableName } = await _getQueryData(survey, nodeDefUuidTable)
  return await DataViewReadRepository.runCount(surveyId, cycle, tableName, filter)
}

export const populateTable = DataTableInsertRepository.populateTable
export const updateTable = DataTableUpdateRepository.updateTable

export const countDuplicateRecords = DataViewReadRepository.countDuplicateRecords
export const fetchRecordsCountByKeys = DataViewReadRepository.fetchRecordsCountByKeys
export const fetchRecordsWithDuplicateEntities = DataTableReadRepository.fetchRecordsWithDuplicateEntities

// Result views
export const generateResultViews = async (surveyId, client = db) => {
  const resultStepViewsByEntityUuid = {}

  const chains = await ProcessingChainRepository.fetchChainsBySurveyId(surveyId, null, 0, null, client)

  for (const chain of chains) {
    const steps = await ProcessingStepRepository.fetchStepsAndCalculationsByChainUuid(
      surveyId,
      ProcessingChain.getUuid(chain),
      client,
    )
    for (const step of steps) {
      if (ProcessingStep.hasEntity(step)) {
        const calculationNodeDefUuids = R.pipe(
          ProcessingStep.getCalculations,
          R.map(ProcessingStepCalculation.getNodeDefUuid),
        )(step)

        const nodeDefColumns = await Promise.all(
          calculationNodeDefUuids.map(nodeDefUuid =>
            NodeDefRepository.fetchNodeDefByUuid(surveyId, nodeDefUuid, false, false, client),
          ),
        )

        const entityDefUuid = ProcessingStep.getEntityUuid(step)
        const resultStepViews = R.propOr([], entityDefUuid, resultStepViewsByEntityUuid)
        resultStepViews.push(ResultStepView.newResultStepView(step, nodeDefColumns))
        resultStepViewsByEntityUuid[entityDefUuid] = resultStepViews
      }
    }
  }

  return resultStepViewsByEntityUuid
}
