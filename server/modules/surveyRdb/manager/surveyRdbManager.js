import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as PromiseUtils from '@core/promiseUtils'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'

import { db } from '../../../db/db'
import * as CSVWriter from '../../../utils/file/csvWriter'

import { ColumnNodeDef, ViewDataNodeDef } from '../../../../common/model/db'

import { Query } from '../../../../common/model/query'
import * as NodeDefTable from '../../../../common/surveyRdb/nodeDefTable'

import * as DataTableInsertRepository from '../repository/dataTableInsertRepository'
import * as DataTableReadRepository from '../repository/dataTableReadRepository'
import * as DataTableRepository from '../repository/dataTable'
import * as DataViewRepository from '../repository/dataView'

// ==== DDL

// schema
export { createSchema, dropSchema } from '../repository/schemaRdbRepository'

// Data tables and views
export const { createDataTable } = DataTableRepository
export const { createDataView, countViewDataAgg } = DataViewRepository

// Node key views
export { createNodeKeysView } from '../repository/nodeKeysViewRepository'
export { createNodeHierarchyDisaggregatedView } from '../repository/nodeHierarchyDisaggregatedViewRepository'
export { createNodeKeysHierarchyView } from '../repository/nodeKeysHierarchyViewRepository'

// Result tables and views
export { deleteNodeResultsByChainUuid, MassiveUpdateData, MassiveUpdateNodes } from '../repository/resultNode'

// ==== DML

const _getExportFields = ({ survey, query, addCycle = false, includeCategoryItemsLabels = true }) => {
  const entityDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const viewDataNodeDef = new ViewDataNodeDef(survey, entityDef)
  // Consider only user selected fields (from column node defs)
  const nodeDefUuidCols = Query.getAttributeDefUuids(query)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const fields = nodeDefCols.flatMap((nodeDefCol) => {
    if (!includeCategoryItemsLabels && NodeDef.isCode(nodeDefCol)) {
      // keep only code column
      return [NodeDef.getName(nodeDefCol)]
    } else {
      return new ColumnNodeDef(viewDataNodeDef, nodeDefCol).names
    }
  })
  // Cycle is 0-based
  return [...(addCycle ? [DataTable.columnNameRecordCycle] : []), ...fields]
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
  const {
    survey,
    cycle,
    query,
    columnNodeDefs = false,
    offset = 0,
    limit = null,
    streamOutput = null,
    addCycle = false,
    includeCategoryItemsLabels = true,
  } = params

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
      const fields = _getExportFields({ survey, query, addCycle, includeCategoryItemsLabels })
      stream.pipe(CSVWriter.transformToStream(streamOutput, fields))
    })
    return null
  }
  return result
}

const _getExportFieldsAgg = ({ survey, query }) => {
  const nodeDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)

  const fields = []
  // dimensions
  Query.getDimensions(query).forEach((dimension) => {
    const nodeDefDimension = Survey.getNodeDefByUuid(dimension)(viewDataNodeDef.survey)
    fields.push(new ColumnNodeDef(viewDataNodeDef, nodeDefDimension).name)
  })
  // measures
  Array.from(Query.getMeasures(query).entries()).forEach(([nodeDefUuid, aggFunctions]) => {
    const nodeDefMeasure = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    aggFunctions.forEach((aggregateFnOrUuid) => {
      const fieldAlias = ColumnNodeDef.getColumnNameAggregateFunction({
        nodeDef: nodeDefMeasure,
        aggregateFn: aggregateFnOrUuid,
      })
      fields.push(fieldAlias)
    })
  })
  return fields
}

/**
 * Runs a select query on a data view associated to an entity node definition,
 * aggregating the rows by the given measures aggregate functions and grouping by the given dimensions.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The query object.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {boolean} [params.streamOutput=null] - The output to be used to stream the data (if specified).
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewDataAgg = async (params) => {
  const { survey, cycle, query, limit, offset, streamOutput } = params

  // Fetch data
  const result = await DataViewRepository.fetchViewDataAgg({
    survey,
    cycle,
    query,
    limit,
    offset,
    stream: Boolean(streamOutput),
  })

  if (streamOutput) {
    await db.stream(result, (stream) => {
      const fields = _getExportFieldsAgg({ survey, query })
      stream.pipe(CSVWriter.transformToStream(streamOutput, fields))
    })
    return null
  }
  return result
}

export const fetchEntitiesDataToCsvFiles = async (
  { surveyId, outputDir, includeCategoryItemsLabels, includeAnalysis, callback },
  client
) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, includeAnalysis }, client)

  const nodeDefs = Survey.getNodeDefsArray(survey).filter(
    (nodeDef) => NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef)
  )

  callback?.({ total: nodeDefs.length })

  await PromiseUtils.each(nodeDefs, async (nodeDefContext, idx) => {
    const entityDefUuid = NodeDef.getUuid(nodeDefContext)
    const stream = FileUtils.createWriteStream(FileUtils.join(outputDir, `${NodeDef.getName(nodeDefContext)}.csv`))

    const childDefs = NodeDef.isEntity(nodeDefContext)
      ? Survey.getNodeDefDescendantAttributesInSingleEntities(nodeDefContext, includeAnalysis)(survey)
      : [nodeDefContext] // Multiple attribute

    let parentKeys = []
    Survey.visitAncestorsAndSelf(nodeDefContext, (n) => {
      if (NodeDef.getUuid(n) === NodeDef.getUuid(nodeDefContext)) return
      const keys = Survey.getNodeDefKeys(n)(survey)
      parentKeys = parentKeys.concat(keys)
    })(survey)

    let query = Query.create({ entityDefUuid })
    const queryAttributeDefs = parentKeys.reverse().concat(childDefs)
    query = Query.assocAttributeDefUuids(queryAttributeDefs.map(NodeDef.getUuid))(query)

    callback?.({ step: idx + 1, total: nodeDefs.length, currentEntity: NodeDef.getName(nodeDefContext) })

    await fetchViewData({
      survey,
      columnNodeDefs: childDefs,
      streamOutput: stream,
      query,
      addCycle: true,
      includeCategoryItemsLabels,
    })
  })
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

/**
 * Returns the count of rows in the data views of the specified entity defs, indexed by entity def UUID.
 * If entityDefUuids is not specified, all the entity defs will be considered.
 *
 * @param {!object} params - The parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {string[]} [params.entityDefUuids] - The UUIDs of the entity definition data views to count.
 * @returns {Promise<object>} - Count of view data tables indexed by entity def UUID.
 */
export const countTables = async ({ survey, cycle, entityDefUuids: entityDefUuidsParam = [] }) => {
  const entityDefUuids =
    entityDefUuidsParam?.length > 0
      ? entityDefUuidsParam
      : Survey.getNodeDefsArray(survey).filter(NodeDef.isMultipleEntity).map(NodeDef.getUuid)

  const countsArray = await Promise.all(
    entityDefUuids.map((entityDefUuid) => countTable({ survey, cycle, query: Query.create({ entityDefUuid }) }))
  )
  return entityDefUuids.reduce((acc, entityDefUuid, index) => ({ ...acc, [entityDefUuid]: countsArray[index] }), {})
}

export const { populateTable } = DataTableInsertRepository

export const { fetchRecordsWithDuplicateEntities } = DataTableReadRepository
