import pgPromise from 'pg-promise'

import { Dates, Objects, SystemError } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as PromiseUtils from '@core/promiseUtils'
import * as StringUtils from '@core/stringUtils'

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
export { deleteRowsByRecordUuid } from '../repository/dataTableDeleteRepository'

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
    nullsToEmpty = false,
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
          objectTransformer: SurveyRdbCsvExport.getCsvObjectTransformer({
            survey,
            query,
            expandCategoryItems,
            nullsToEmpty,
          }),
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

const _determineRecordUuidsFilter = async ({ survey, cycle, recordsModifiedAfter, recordUuidsParam, search }) => {
  if (recordUuidsParam) return recordUuidsParam

  if (Objects.isEmpty(search) && !recordsModifiedAfter) return null

  const surveyId = Survey.getId(survey)
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
  let recordsSummaries = await RecordRepository.fetchRecordsSummaryBySurveyId({
    surveyId,
    nodeDefRoot,
    nodeDefKeys,
    cycle,
    search,
  })
  if (recordsModifiedAfter) {
    recordsSummaries = recordsSummaries.filter((recordSummary) =>
      Dates.isAfter(Record.getDateModified(recordSummary), recordsModifiedAfter)
    )
  }
  return recordsSummaries.map(Record.getUuid)
}

export const fetchEntitiesDataToCsvFiles = async (
  {
    survey,
    cycle,
    includeCategoryItemsLabels,
    expandCategoryItems,
    includeAncestorAttributes,
    includeAnalysis,
    includeFiles,
    recordOwnerUuid = null,
    recordUuids: recordUuidsParam = null,
    recordsModifiedAfter,
    search = null,
    outputDir,
    callback,
  },
  client = db
) => {
  const addCycle = Survey.getCycleKeys(survey).length > 1

  const nodeDefs = Survey.findDescendants({
    filterFn: (nodeDef) => NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef),
  })(survey)

  const recordUuids = await _determineRecordUuidsFilter({
    survey,
    cycle,
    recordsModifiedAfter,
    recordUuidsParam,
    search,
  })

  if (recordUuids?.length === 0) {
    throw new SystemError('dataExport.noRecordsMatchingSearchCriteria')
  }

  callback?.({ total: nodeDefs.length })

  const getChildAttributes = (nodeDef) =>
    Survey.getNodeDefDescendantAttributesInSingleEntities({
      nodeDef,
      includeAnalysis,
      includeMultipleAttributes: !!expandCategoryItems,
      sorted: true,
      cycle,
    })(survey)

  await PromiseUtils.each(nodeDefs, async (nodeDefContext, idx) => {
    const entityDefUuid = NodeDef.getUuid(nodeDefContext)
    const outputFilePrefix = StringUtils.padStart(2, '0')(String(idx + 1))
    const outputFileName = `${outputFilePrefix}_${NodeDef.getName(nodeDefContext)}.csv`
    const outputFilePath = FileUtils.join(outputDir, outputFileName)
    const outputStream = FileUtils.createWriteStream(outputFilePath)

    const childDefs = (
      NodeDef.isEntity(nodeDefContext)
        ? getChildAttributes(nodeDefContext)
        : // Multiple attribute
          [nodeDefContext]
    ).filter((childDef) => includeFiles || !NodeDef.isFile(childDef))

    const ancestorDefs = []
    if (includeAncestorAttributes) {
      Survey.visitAncestors(
        nodeDefContext,
        (nodeDef) => {
          ancestorDefs.push(...getChildAttributes(nodeDef))
        },
        false
      )(survey)
    } else {
      ancestorDefs.push(...Survey.getNodeDefAncestorsKeyAttributes(nodeDefContext)(survey))
    }

    let query = Query.create({ entityDefUuid })
    const queryAttributeDefUuids = ancestorDefs.concat(childDefs).map(NodeDef.getUuid)
    query = Query.assocAttributeDefUuids(queryAttributeDefUuids)(query)
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

export const fetchEntitiesFileUuidsByCycle = async (
  { survey, cycle, recordOwnerUuid = null, filterRecordUuids = null },
  client = db
) => {
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
    const query = Query.create({
      entityDefUuid,
      attributeDefUuids: childrenFileDefs.map(NodeDef.getUuid),
      filterRecordUuids,
    })

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
