import * as R from 'ramda'

import { ColumnNodeDef, ViewDataNodeDef } from '../../../../common/model/db'
import { Query } from '../../../../common/model/query'
import * as Chain from '../../../../common/analysis/processingChain'
import * as Step from '../../../../common/analysis/processingStep'
import * as Calculation from '../../../../common/analysis/processingStepCalculation'
import * as NodeDefTable from '../../../../common/surveyRdb/nodeDefTable'
import * as EntityAggregatedView from '../../../../common/surveyRdb/entityAggregatedView'

import * as Survey from '../../../../core/survey/survey'
import * as NodeDef from '../../../../core/survey/nodeDef'
import * as PromiseUtils from '../../../../core/promiseUtils'

import { db } from '../../../db/db'
import * as CSVWriter from '../../../utils/file/csvWriter'
import * as ChainRepository from '../../analysis/repository/chain'

import * as DataTableInsertRepository from '../repository/dataTableInsertRepository'
import * as DataTableReadRepository from '../repository/dataTableReadRepository'
import * as DataTableRepository from '../repository/dataTable'
import * as DataViewRepository from '../repository/dataView'

// ==== DDL

// schema
export { createSchema, dropSchema } from '../repository/schemaRdbRepository'

// Data tables and views
export const { createDataTable } = DataTableRepository
export const { createDataView, countViewDataAgg, fetchViewDataAgg } = DataViewRepository

// Node key views
export { createNodeKeysView } from '../repository/nodeKeysViewRepository'
export { createNodeHierarchyDisaggregatedView } from '../repository/nodeHierarchyDisaggregatedViewRepository'
export { createNodeKeysHierarchyView } from '../repository/nodeKeysHierarchyViewRepository'

// Result tables and views
export { createResultNodeTable, deleteNodeResultsByChainUuid, MassiveInsertResultNodes } from '../repository/resultNode'
export { createResultStepView, refreshResultStepView } from '../repository/resultStep'

// ==== DML

const _getExportFields = ({ survey, query }) => {
  const nodeDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)
  // Consider only user selected fields (from column node defs)
  const nodeDefUuidCols = Query.getAttributeDefUuids(query)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  return nodeDefCols.map((nodeDefCol) => new ColumnNodeDef(viewDataNodeDef, nodeDefCol).names).flat()
}

/**
 * Executes a select query on an entity definition data view.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query to execute.
 * @param {boolean} [params.columnNodeDefs=false] - Whether to select only columnNodes.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {boolean} [params.streamOutput=null] - The output to be used to stream the data (if specified).
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewData = async (params) => {
  const { survey, cycle, query, columnNodeDefs = false, offset = 0, limit = null, streamOutput = null } = params

  // Fetch data
  const result = await DataViewRepository.fetchViewData({
    survey,
    cycle,
    query,
    columnNodeDefs,
    offset,
    limit,
    stream: Boolean(streamOutput),
  })

  if (streamOutput) {
    await db.stream(result, (stream) => {
      const fields = _getExportFields({ survey, query })
      stream.pipe(CSVWriter.transformToStream(streamOutput, fields))
    })
  }
  return result
}

/**
 * Counts the number of rows in the data view related to the specified query object.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query used to filter the rows.
 *
 * @returns {Promise<number>} - The number of rows.
 */
export const countTable = async ({ survey, cycle, query }) => {
  const surveyId = Survey.getId(survey)
  const nodeDefTable = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const tableName = NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey))
  const filter = Query.getFilter(query)
  return DataViewRepository.runCount({ surveyId, cycle, tableName, filter })
}

export const { populateTable } = DataTableInsertRepository

export const { fetchRecordsWithDuplicateEntities } = DataTableReadRepository

// eslint-disable-next-line jsdoc/require-description,jsdoc/require-param
/**
 * @deprecated - Use ChainRepository.fetchChains({ surveyId, includeStepsAndCalculations: true }, client) and iterate normally.
 */
const _visitProcessingSteps = async (surveyId, client, visitor) => {
  const chains = await ChainRepository.fetchChains({ surveyId, includeStepsAndCalculations: true }, client)
  await PromiseUtils.each(chains, async (chain) =>
    PromiseUtils.each(Chain.getProcessingSteps(chain), async (step) => visitor(step, chain))
  )
}

// Aggregated entity views
export const getEntityAggregatedViews = async (survey, client = db) => {
  const entityAggregatedViewsByUuid = {}

  const surveyId = Survey.getId(survey)

  await _visitProcessingSteps(surveyId, client, async (step, chain) => {
    if (Step.hasEntity(step, chain)) {
      const entityUuid = Step.getEntityUuid(step)
      const calculations = Step.getCalculations(step)
      calculations.forEach((calculation) => {
        if (Calculation.hasAggregateFunction(calculation)) {
          let entityAggregatedView = entityAggregatedViewsByUuid[entityUuid]
          if (entityAggregatedView) {
            entityAggregatedView = EntityAggregatedView.addCalculation(calculation)(entityAggregatedView)
          } else {
            const entityDef = Survey.getNodeDefByUuid(entityUuid)(survey)
            const entityAggregatedViewEntityDef = NodeDef.isVirtual(entityDef)
              ? Survey.getNodeDefParent(entityDef)(survey)
              : R.pipe(Chain.getStepPrev(step), Step.getEntityUuid, (entityDefUuid) =>
                  Survey.getNodeDefByUuid(entityDefUuid)(survey)
                )(chain)

            entityAggregatedView = EntityAggregatedView.newEntityAggregatedView(entityAggregatedViewEntityDef, [
              calculation,
            ])
          }

          entityAggregatedViewsByUuid[entityUuid] = entityAggregatedView
        }
      })
    }
  })
  return entityAggregatedViewsByUuid
}
