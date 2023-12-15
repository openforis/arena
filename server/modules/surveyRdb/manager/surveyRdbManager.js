import pgPromise from 'pg-promise'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as PromiseUtils from '@core/promiseUtils'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'

import { db } from '../../../db/db'
import * as CSVWriter from '../../../utils/file/csvWriter'

import { ColumnNodeDef, TableDataNodeDef, ViewDataNodeDef } from '../../../../common/model/db'

import { Query } from '../../../../common/model/query'
import * as NodeDefTable from '../../../../common/surveyRdb/nodeDefTable'

import * as DataTableInsertRepository from '../repository/dataTableInsertRepository'
import * as DataTableReadRepository from '../repository/dataTableReadRepository'
import * as DataTableRepository from '../repository/dataTable'
import * as DataViewRepository from '../repository/dataView'
import { SurveyRdbCsvExport } from './surveyRdbCsvExport'

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

/**
 * Executes a select query on an entity definition data view.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query to execute.
 * @param {boolean} [params.columnNodeDefs=false] - Whether to select only columnNodes.
 * @param {boolean} [params.includeFileAttributeDefs=true] - Whether to include file attribute column node defs.
 * @param {Array} [params.recordSteps] - The record steps used to filter data. If null or empty, data in all steps will be fetched.
 * @param {string} [params.recordOwnerUuid] - The record owner UUID. If null, data from all records will be fetched, otherwise only the ones owned by the specified user.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {boolean} [params.streamOutput=null] - The output to be used to stream the data (if specified).
 *
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewData = async (params, client = db) => {
  const {
    survey,
    cycle,
    query,
    columnNodeDefs = false,
    includeFileAttributeDefs = true,
    recordSteps = null,
    recordOwnerUuid = null,
    offset = 0,
    limit = null,
    streamOutput = null,
    addCycle = false,
    includeCategoryItemsLabels = true,
    expandCategoryItems = false,
  } = params

  // Fetch data
  const result = await DataViewRepository.fetchViewData(
    {
      survey,
      cycle,
      query,
      columnNodeDefs,
      includeFileAttributeDefs,
      recordSteps,
      recordOwnerUuid,
      offset,
      limit,
      stream: Boolean(streamOutput),
    },
    client
  )

  if (streamOutput) {
    const fields = columnNodeDefs
      ? null // all fields will be included in the CSV file
      : SurveyRdbCsvExport.getCsvExportFields({
          survey,
          query,
          addCycle,
          includeCategoryItemsLabels,
          expandCategoryItems,
        })
    await db.stream(result, (dbStream) => {
      const csvTransform = CSVWriter.transformJsonToCsv({
        fields,
        options: {
          objectTransformer: SurveyRdbCsvExport.getCsvObjectTransformer({ survey, query, expandCategoryItems }),
        },
      })
      dbStream.pipe(csvTransform).pipe(streamOutput)
    })
    return null
  }
  return result
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
 * @param {string} [params.recordOwnerUuid] - The record owner UUID. If null, data from all records will be fetched, otherwise only the ones owned by the specified user.
 * @param {number} [params.limit=null] - The query limit.
 * @param {boolean} [params.streamOutput=null] - The output to be used to stream the data (if specified).
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewDataAgg = async (params) => {
  const { survey, cycle, query, recordOwnerUuid = null, limit, offset, streamOutput = null } = params

  // Fetch data
  const result = await DataViewRepository.fetchViewDataAgg({
    survey,
    cycle,
    query,
    recordOwnerUuid,
    limit,
    offset,
    stream: Boolean(streamOutput),
  })

  if (streamOutput) {
    await db.stream(result, (dbStream) => {
      const fields = SurveyRdbCsvExport.getCsvExportFieldsAgg({ survey, query })
      const csvTransform = CSVWriter.transformJsonToCsv({ fields })
      dbStream.pipe(csvTransform).pipe(streamOutput)
    })
    return null
  }
  return result
}

export const fetchEntitiesDataToCsvFiles = async (
  {
    survey,
    cycle,
    includeCategoryItemsLabels,
    expandCategoryItems,
    includeAnalysis,
    recordOwnerUuid = null,
    recordUuids: recordUuidsParam = null,
    search = null,
    outputDir,
    callback,
  },
  client = db
) => {
  const addCycle = Survey.getCycleKeys(survey).length > 1

  const nodeDefs = Survey.getNodeDefsArray(survey).filter(
    (nodeDef) => NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef)
  )

  let recordUuids = null
  if (recordUuidsParam) {
    recordUuids = recordUuidsParam
  } else if (!Objects.isEmpty(search)) {
    const surveyId = Survey.getId(survey)
    const nodeDefRoot = Survey.getNodeDefRoot(survey)
    const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
    const recordsSummaries = await RecordRepository.fetchRecordsSummaryBySurveyId({
      surveyId,
      nodeDefRoot,
      nodeDefKeys,
      cycle,
      search,
    })
    recordUuids = recordsSummaries.length > 0 ? recordsSummaries.map(Record.getUuid) : null
  }

  callback?.({ total: nodeDefs.length })

  await PromiseUtils.each(nodeDefs, async (nodeDefContext, idx) => {
    const entityDefUuid = NodeDef.getUuid(nodeDefContext)
    const outputFilePath = FileUtils.join(outputDir, `${NodeDef.getName(nodeDefContext)}.csv`)
    const outputStream = FileUtils.createWriteStream(outputFilePath)

    const childDefs = NodeDef.isEntity(nodeDefContext)
      ? Survey.getNodeDefDescendantAttributesInSingleEntities({
          nodeDef: nodeDefContext,
          includeAnalysis,
          includeMultipleAttributes: !!expandCategoryItems,
          sorted: true,
          cycle,
        })(survey)
      : [nodeDefContext] // Multiple attribute

    const ancestorKeysDefs = Survey.getNodeDefAncestorsKeyAttributes(nodeDefContext)(survey)

    let query = Query.create({ entityDefUuid })
    const ancestorKeyDefsUuids = ancestorKeysDefs.concat(childDefs).map(NodeDef.getUuid)
    query = Query.assocAttributeDefUuids(ancestorKeyDefsUuids)(query)
    query = Query.assocFilterRecordUuids(recordUuids)(query)

    callback?.({ step: idx + 1, total: nodeDefs.length, currentEntity: NodeDef.getName(nodeDefContext) })

    await fetchViewData(
      {
        survey,
        cycle,
        recordOwnerUuid,
        streamOutput: outputStream,
        query,
        addCycle,
        includeCategoryItemsLabels,
        expandCategoryItems,
      },
      client
    )
  })
}

export const fetchEntitiesFileUuidsByCycle = async ({ survey, cycle, recordOwnerUuid = null }, client = db) => {
  const nodeDefs = Survey.getNodeDefsArray(survey).filter(
    (nodeDef) => NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef)
  )

  const fileUuidsByCycle = {}
  let total = 0

  await PromiseUtils.each(nodeDefs, async (nodeDefContext) => {
    const childrenFileDefs = (
      NodeDef.isEntity(nodeDefContext)
        ? Survey.getNodeDefDescendantAttributesInSingleEntities({ nodeDef: nodeDefContext })(survey)
        : [nodeDefContext]
    ).filter(NodeDef.isFile)

    if (childrenFileDefs.length === 0) {
      return
    }

    const entityDefUuid = NodeDef.getUuid(nodeDefContext)
    let query = Query.create({ entityDefUuid })
    const queryAttributeDefsUuids = childrenFileDefs.map(NodeDef.getUuid)
    query = Query.assocAttributeDefUuids(queryAttributeDefsUuids)(query)

    const entityData = await fetchViewData({ survey, cycle, recordOwnerUuid, query, addCycle: true }, client)
    const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDefContext)

    entityData.forEach((entityRow) => {
      childrenFileDefs.forEach((nodeDefFile) => {
        const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDefFile)
        const fileUuidColumnName = columnNodeDef.name
        const fileUuid = entityRow[fileUuidColumnName]
        if (fileUuid) {
          const rowCycle = entityRow[TableDataNodeDef.columnSet.recordCycle]
          const fileUuids = fileUuidsByCycle[rowCycle] || []
          fileUuids.push(fileUuid)
          fileUuidsByCycle[rowCycle] = fileUuids
          total++
        }
      })
    })
  })
  return { fileUuidsByCycle, total }
}

/**
 * Counts the number of rows in the data view related to the specified query object.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query used to filter the rows.
 * @param {pgPromise.IDatabase} client - The database client.
 * @returns {Promise<number>} - The number of rows.
 */
export const countTable = async ({ survey, cycle, recordOwnerUuid, query }, client = db) => {
  const surveyId = Survey.getId(survey)
  const nodeDefTable = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const tableName = NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey))
  const filter = Query.getFilter(query)
  return DataViewRepository.runCount({ surveyId, cycle, tableName, filter, recordOwnerUuid }, client)
}

/**
 * Returns the count of rows in the data views of the specified entity defs, indexed by entity def UUID.
 * If entityDefUuids is not specified, all the entity defs will be considered.
 *
 * @param {!object} params - The parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {string[]} [params.entityDefUuids] - The UUIDs of the entity definition data views to count.
 * @param {pgPromise.IDatabase} client - The database client.
 * @returns {Promise<object>} - Count of view data table rows indexed by related view data entity def UUID.
 */
export const fetchTableRowsCountByEntityDefUuid = async (
  { survey, cycle, entityDefUuids: entityDefUuidsParam = [] },
  client = db
) => {
  const entityDefUuids =
    entityDefUuidsParam?.length > 0
      ? entityDefUuidsParam
      : Survey.getNodeDefsArray(survey)
          .filter((nodeDef) => NodeDef.isMultipleEntity(nodeDef) && NodeDef.isInCycle(cycle)(nodeDef))
          .map(NodeDef.getUuid)

  const countsArray = await client.tx(async (tx) =>
    Promise.all(
      entityDefUuids.map((entityDefUuid) => countTable({ survey, cycle, query: Query.create({ entityDefUuid }) }, tx))
    )
  )
  return entityDefUuids.reduce((acc, entityDefUuid, index) => ({ ...acc, [entityDefUuid]: countsArray[index] }), {})
}

export const filterEntitiesWithData = async ({ survey, cycle, entityDefs }) => {
  const entityDefUuids = entityDefs.map(NodeDef.getUuid)
  const dataViewCountsByEntityDefUuid = await fetchTableRowsCountByEntityDefUuid({ survey, cycle, entityDefUuids })
  return entityDefs.filter((entityDef) => {
    const dataViewCount = dataViewCountsByEntityDefUuid[NodeDef.getUuid(entityDef)]
    return dataViewCount > 0
  })
}

export const { populateTable } = DataTableInsertRepository

export const { fetchRecordsWithDuplicateEntities } = DataTableReadRepository
