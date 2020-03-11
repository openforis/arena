import * as R from 'ramda'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ResultStepView from '@common/surveyRdb/resultStepView'
import * as EntityAggregatedView from '@common/surveyRdb/entityAggregatedView'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { db } from '@server/db/db'
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as ProcessingChainRepository from '@server/modules/analysis/repository/processingChainRepository'
import * as ProcessingStepRepository from '@server/modules/analysis/repository/processingStepRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as NodeRepository from '@server/modules/record/repository/nodeRepository'
import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'

import * as DataTableInsertRepository from '../repository/dataTableInsertRepository'
import * as DataTableUpdateRepository from '../repository/dataTableUpdateRepository'
import * as DataTableReadRepository from '../repository/dataTableReadRepository'
import * as DataViewReadRepository from '../repository/dataViewReadRepository'
import * as SchemaRdbRepository from '../repository/schemaRdbRepository'
import * as ResultNodeTableRepository from '../repository/resultNodeTableRepository'
import * as ResultStepViewRepository from '../repository/resultStepViewRepository'

// ==== DDL

// schema
export { createSchema, dropSchema } from '../repository/schemaRdbRepository'

// Data tables and views
export { createTableAndView } from '../repository/dataViewCreateRepository'

// Node key views
export { createNodeKeysView } from '../repository/nodeKeysViewRepository'
export { createNodeHierarchyDisaggregatedView } from '../repository/nodeHierarchyDisaggregatedViewRepository'
export { createNodeKeysHierarchyView } from '../repository/nodeKeysHierarchyViewRepository'

// Result tables and views
export { createResultNodeTable } from '../repository/resultNodeTableRepository'
export { createResultStepView } from '../repository/resultStepViewRepository'

export const grantPermissionsToUserAnalysis = async (surveyId, client) => {
  // Grant SELECT on RDB schema tables and views
  await SchemaRdbRepository.grantSelectToUserAnalysis(surveyId, client)

  // Grant INSERT/UPDATE/DELETE on _res_node table
  await ResultNodeTableRepository.grantWriteToUserAnalysis(surveyId, client)

  // Change result step view owner to user analysis (to allow view refresh by user analysis)
  const resultViewsByEntityUuid = await generateResultViews(surveyId, client)
  const resultViewNames = R.pipe(R.values, R.flatten, R.map(ResultStepView.getViewName))(resultViewsByEntityUuid)
  for (const resultViewName of resultViewNames) {
    await ResultStepViewRepository.updateOwnerToUserAnalysis(surveyId, resultViewName, client)
  }
}

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

const _visitProcessingSteps = async (surveyId, client, visitor) => {
  const chains = await ProcessingChainRepository.fetchChainsBySurveyId(surveyId, null, 0, null, client)
  for (const chain of chains) {
    const steps = await ProcessingStepRepository.fetchStepsAndCalculationsByChainUuid(
      surveyId,
      ProcessingChain.getUuid(chain),
      client,
    )
    for (const step of steps) {
      await visitor(step, ProcessingChain.assocProcessingSteps(steps)(chain))
    }
  }
}

// Result views
export const generateResultViews = async (surveyId, client = db) => {
  const resultStepViewsByEntityUuid = {}

  await _visitProcessingSteps(surveyId, client, async step => {
    if (ProcessingStep.hasEntity(step)) {
      const calculations = ProcessingStep.getCalculations(step)
      if (R.none(ProcessingStepCalculation.hasAggregateFunction, calculations)) {
        const calculationNodeDefUuids = R.map(ProcessingStepCalculation.getNodeDefUuid)(calculations)
        const nodeDefColumns = await Promise.all(
          calculationNodeDefUuids.map(nodeDefUuid =>
            NodeDefRepository.fetchNodeDefByUuid(surveyId, nodeDefUuid, false, false, client),
          ),
        )
        const entityDefUuid = ProcessingStep.getEntityUuid(step)
        const resultStepViews = R.propOr([], entityDefUuid, resultStepViewsByEntityUuid)
        resultStepViews.push(ResultStepView.newResultStepView(step, calculations, nodeDefColumns))
        resultStepViewsByEntityUuid[entityDefUuid] = resultStepViews
      }
    }
  })
  return resultStepViewsByEntityUuid
}

// Aggregated entity views
export const generateEntityAggregatedViews = async (survey, client = db) => {
  const entityAggregatedViewsByUuid = {}

  const surveyId = Survey.getId(survey)

  await _visitProcessingSteps(surveyId, client, async (step, chain) => {
    if (ProcessingStep.hasEntity(step, chain)) {
      const entityUuid = ProcessingStep.getEntityUuid(step)
      const calculations = ProcessingStep.getCalculations(step)
      for (const calculation of calculations) {
        if (ProcessingStepCalculation.hasAggregateFunction(calculation)) {
          let entityAggregatedView = entityAggregatedViewsByUuid[entityUuid]
          if (entityAggregatedView) {
            entityAggregatedView = EntityAggregatedView.addCalculation(calculation)(entityAggregatedView)
          } else {
            const entityDef = Survey.getNodeDefByUuid(entityUuid)(survey)
            const entityAggregatedViewEntityDef = NodeDef.isVirtual(entityDef)
              ? Survey.getNodeDefParent(entityDef)(survey)
              : R.pipe(ProcessingChain.getStepPrev(step), ProcessingStep.getEntityUuid, entityDefUuid =>
                  Survey.getNodeDefByUuid(entityDefUuid)(survey),
                )(chain)

            entityAggregatedView = EntityAggregatedView.newEntityAggregatedView(entityAggregatedViewEntityDef, [
              calculation,
            ])
          }

          entityAggregatedViewsByUuid[entityUuid] = entityAggregatedView
        }
      }
    }
  })
  return entityAggregatedViewsByUuid
}
