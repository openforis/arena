import pgPromise from 'pg-promise'

import { Dates, Objects, SystemError } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as PromiseUtils from '@core/promiseUtils'
import * as StringUtils from '@core/stringUtils'
import { FileFormats, getExtensionByFileFormat } from '@core/fileFormats'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'

import { db } from '../../../db/db'
import * as DbUtils from '../../../db/dbUtils'
import * as FlatDataWriter from '../../../utils/file/flatDataWriter'

import { ColumnNodeDef, TableDataNodeDef, ViewDataNodeDef } from '../../../../common/model/db'

import { Query } from '../../../../common/model/query'
import * as NodeDefTable from '../../../../common/surveyRdb/nodeDefTable'

import * as DataTableInsertRepository from '../repository/dataTableInsertRepository'
import * as DataTableReadRepository from '../repository/dataTableReadRepository'
import * as DataTableRepository from '../repository/dataTable'
import * as DataViewRepository from '../repository/dataView'
import { SurveyRdbCsvExport } from './surveyRdbCsvExport'
import { UniqueFileNamesGenerator } from './UniqueFileNamesGenerator'
import { StreamUtils } from '@server/utils/streamUtils'

// ==== DDL

// schema
export {
  createSchema,
  dropSchema,
  selectOlapDataTablesExists,
  dropDataTablesAndViews,
  dropOlapDataTablesAndViews,
} from '../repository/schemaRdbRepository'

// Data tables and views
export const { createDataTable } = DataTableRepository
export const { createDataView, countViewData, countViewDataAgg } = DataViewRepository
export { deleteRowsByRecordUuid } from '../repository/dataTableDeleteRepository'

// Node key views
export { createNodeKeysView } from '../repository/nodeKeysViewRepository'
export { createNodeHierarchyDisaggregatedView } from '../repository/nodeHierarchyDisaggregatedViewRepository'
export { createNodeKeysHierarchyView } from '../repository/nodeKeysHierarchyViewRepository'

// Result tables and views
export { deleteNodeResultsByChainUuid, MassiveUpdateData, MassiveUpdateNodes } from '../repository/resultNode'

export { createOlapDataTable, insertOlapData, clearOlapData } from '../repository/olapDataTable'
export { createOlapAreaView } from '../repository/olapAreaView'

const maxExcelCellsLimit = 1000000

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
 * @param {boolean|object} [params.outputStream=null] - The output to be used to stream the data (if specified).
 * @param {string} [params.fileFormat=null] - The format of the output file (csv or xlsx).
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
    outputStream = null,
    fileFormat = null,
    addCycle = false,
    includeCategoryItemsLabels = true,
    expandCategoryItems = false,
    includeInternalUuids = false,
    includeDateCreated = false,
    nullsToEmpty = false,
    uniqueFileNamesGenerator = null,
  } = params

  // Fetch data
  const result = await DataViewRepository.fetchViewData(
    {
      survey,
      cycle,
      query,
      columnNodeDefs,
      includeFileAttributeDefs,
      includeDateCreated,
      recordSteps,
      recordOwnerUuid,
      offset,
      limit,
      stream: Boolean(outputStream),
    },
    client
  )

  if (outputStream) {
    const fields = columnNodeDefs
      ? null // all fields will be included in the CSV file
      : SurveyRdbCsvExport.getCsvExportFields({
          survey,
          query,
          addCycle,
          includeCategoryItemsLabels,
          expandCategoryItems,
          includeInternalUuids,
          includeDateCreated,
        })
    const { transformers } = SurveyRdbCsvExport.getCsvObjectTransformer({
      survey,
      query,
      expandCategoryItems,
      nullsToEmpty,
      keepFileNamesUnique: true,
      uniqueFileNamesGenerator,
    })
    await DbUtils.stream({
      queryStream: result,
      client,
      processor: async (dbStream) =>
        FlatDataWriter.writeItemsStreamToStream({
          stream: dbStream,
          fields,
          options: {
            objectTransformer: Objects.isEmpty(transformers) ? undefined : A.pipe(...transformers),
          },
          outputStream,
          fileFormat,
        }),
    })
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
 * @param {boolean} [params.outputStream=null] - The output to be used to stream the data (if specified).
 * @param {object} [params.options=null] - Export options object (e.g. {fileFormat: 'csv'}).
 * @param {object} client - DB client.
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewDataAgg = async (params, client = db) => {
  const { survey, cycle, query, recordOwnerUuid = null, limit, offset, outputStream = null, options = {} } = params
  const { fileFormat = FileFormats.csv } = options

  // Fetch data
  const result = await DataViewRepository.fetchViewDataAgg(
    {
      survey,
      cycle,
      query,
      recordOwnerUuid,
      limit,
      offset,
      stream: Boolean(outputStream),
    },
    client
  )

  if (outputStream) {
    const fields = SurveyRdbCsvExport.getCsvExportFieldsAgg({ survey, query, options })
    return DbUtils.stream({
      queryStream: result,
      client,
      processor: async (dbStream) =>
        FlatDataWriter.writeItemsStreamToStream({ stream: dbStream, outputStream, fields, fileFormat }),
    })
  }
  return result
}

export const fetchOlapData = async (params, client = db) => {
  const { survey, cycle, query, recordOwnerUuid = null, limit, offset, outputStream = null, options = {} } = params
  const { fileFormat = FileFormats.csv } = options

   // Fetch data
   const result = await DataViewRepository.fetchViewDataAgg(
    {
      survey,
      cycle,
      query,
      recordOwnerUuid,
      limit,
      offset,
      stream: Boolean(outputStream),
    },
    client
  )
}

const _determineRecordUuidsFilter = async ({ survey, cycle, recordsModifiedAfter, recordUuids, search }) => {
  if (recordUuids) return recordUuids

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

export const getEntityDefsToExport = ({ survey, cycle, options }) => {
  const { exportSingleEntitiesIntoSeparateFiles } = options
  return Survey.findDescendants({
    cycle,
    filterFn: (nodeDef) =>
      NodeDef.isRoot(nodeDef) ||
      NodeDef.isMultiple(nodeDef) ||
      (NodeDef.isSingleEntity(nodeDef) && exportSingleEntitiesIntoSeparateFiles),
  })(survey)
}

const createEntityFetchParams = ({
  survey,
  outputDir,
  filterRecordUuids,
  cycle,
  recordOwnerUuid,
  uniqueFileNamesGenerator,
  options,
  nodeDefContext,
  idx,
}) => {
  const {
    includeCategoryItemsLabels,
    expandCategoryItems,
    includeAncestorAttributes,
    exportSingleEntitiesIntoSeparateFiles,
    includeAnalysis,
    includeFileAttributeDefs,
    includeFiles,
    includeInternalUuids,
    includeDateCreated,
    fileFormat,
  } = options

  const getChildAttributes = (nodeDef) => {
    if (exportSingleEntitiesIntoSeparateFiles) {
      const children = Survey.getNodeDefChildrenSorted({ cycle, nodeDef, includeAnalysis })(survey)
      return children.filter(
        (child) => NodeDef.isAttribute(child) && (NodeDef.isSingle(child) || !!expandCategoryItems)
      )
    }
    return Survey.getNodeDefDescendantAttributesInSingleEntities({
      nodeDef,
      includeAnalysis,
      includeMultipleAttributes: !!expandCategoryItems,
      sorted: true,
      cycle,
    })(survey)
  }

  const addCycle = Survey.getCycleKeys(survey).length > 1

  const ancestorMultipleEntity =
    NodeDef.isRoot(nodeDefContext) || NodeDef.isMultiple(nodeDefContext)
      ? nodeDefContext
      : Survey.getNodeDefAncestorMultipleEntity(nodeDefContext)(survey)
  const ancestorEntityDefUuid = NodeDef.getUuid(ancestorMultipleEntity)
  const outputFilePrefix = StringUtils.padStart(2, '0')(String(idx + 1))
  const extension = getExtensionByFileFormat(fileFormat)
  const outputFileName = `${outputFilePrefix}_${NodeDef.getName(nodeDefContext)}.${extension}`
  const outputFilePath = FileUtils.join(outputDir, outputFileName)
  const outputStream = FileUtils.createWriteStream(outputFilePath)

  const childDefs = NodeDef.isEntity(nodeDefContext)
    ? getChildAttributes(nodeDefContext)
    : // Multiple attribute
      [nodeDefContext]

  const ancestorDefs = []
  if (includeAncestorAttributes) {
    Survey.visitAncestors(
      nodeDefContext,
      (nodeDef) => {
        ancestorDefs.unshift(...getChildAttributes(nodeDef))
      },
      false
    )(survey)
  } else {
    const ancestorKeyDefs = Survey.getNodeDefAncestorsKeyAttributes(nodeDefContext)(survey)
    ancestorDefs.unshift(...ancestorKeyDefs)
  }

  const queryAttributeDefUuids = ancestorDefs
    .concat(childDefs)
    .filter((childDef) => includeFileAttributeDefs || includeFiles || !NodeDef.isFile(childDef))
    .map(NodeDef.getUuid)

  const query = Query.create({
    entityDefUuid: ancestorEntityDefUuid,
    attributeDefUuids: queryAttributeDefUuids,
    filterRecordUuids,
  })

  return {
    survey,
    cycle,
    recordOwnerUuid,
    outputStream,
    fileFormat,
    query,
    addCycle,
    includeCategoryItemsLabels,
    expandCategoryItems,
    uniqueFileNamesGenerator,
    includeInternalUuids,
    includeDateCreated,
  }
}

const checkCanExportEntitiesData = async ({ fileFormat, nodeDefs, fetchParamsByNodeDefUuid, client }) => {
  if (fileFormat === FileFormats.xlsx) {
    for (const nodeDefContext of nodeDefs) {
      const fetchViewDataParams = fetchParamsByNodeDefUuid[NodeDef.getUuid(nodeDefContext)]
      const { selectFields, count } = await DataViewRepository.countViewData(fetchViewDataParams, client)
      const estimatedCellsCount = selectFields.length * count
      if (estimatedCellsCount > StreamUtils.defaultMaxCellsLimit) {
        throw new SystemError(`dataExport.excelMaxCellsLimitExceeded`, {
          limit: maxExcelCellsLimit,
          nodeDef: NodeDef.getName(nodeDefContext),
        })
      }
    }
  }
}

export const fetchEntitiesDataToCsvFiles = async (
  {
    survey,
    cycle,
    search = null,
    recordOwnerUuid = null,
    recordUuids: recordUuidsParam = null,
    options,
    outputDir,
    callback,
  },
  client = db
) => {
  const { recordsModifiedAfter, fileFormat } = options

  const nodeDefs = getEntityDefsToExport({ survey, cycle, options })

  const filterRecordUuids = await _determineRecordUuidsFilter({
    survey,
    cycle,
    recordsModifiedAfter,
    recordUuids: recordUuidsParam,
    search,
  })

  if (filterRecordUuids?.length === 0) {
    throw new SystemError('dataExport.noRecordsMatchingSearchCriteria')
  }

  callback?.({ total: nodeDefs.length })

  const uniqueFileNamesGenerator = new UniqueFileNamesGenerator()

  const fetchParamsByNodeDefUuid = nodeDefs.reduce((acc, nodeDefContext, idx) => {
    const fetchViewDataParams = createEntityFetchParams({
      survey,
      outputDir,
      filterRecordUuids,
      cycle,
      recordOwnerUuid,
      uniqueFileNamesGenerator,
      options,
      nodeDefContext,
      idx,
    })
    acc[NodeDef.getUuid(nodeDefContext)] = fetchViewDataParams
    return acc
  }, [])

  await checkCanExportEntitiesData({ nodeDefs, fetchParamsByNodeDefUuid, fileFormat, client })

  let idx = 0
  for (const nodeDefContext of nodeDefs) {
    callback?.({ step: idx + 1, total: nodeDefs.length, currentEntity: NodeDef.getName(nodeDefContext) })
    const fetchViewDataParams = fetchParamsByNodeDefUuid[NodeDef.getUuid(nodeDefContext)]
    await fetchViewData(fetchViewDataParams, client)
    idx++
  }
  return { fileNamesByFileUuid: uniqueFileNamesGenerator.fileNamesByKey }
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
  return DataViewRepository.countDataTableRows({ surveyId, cycle, tableName, filter, recordOwnerUuid }, client)
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
