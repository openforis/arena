import pgPromise from 'pg-promise'

import { Dates, Objects, SystemError, UniqueFileNamesGenerator } from '@openforis/arena-core'

import * as A from '@core/arena'
import { FileFormats, getExtensionByFileFormat } from '@core/fileFormats'
import * as Record from '@core/record/record'
import * as StringUtils from '@core/stringUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { getDataMatrixAttributeDefs } from '@common/dataExport/dataMatrixExport'
import { ColumnNodeDef, TableDataNodeDef, ViewDataNodeDef } from '@common/model/db'
import { Query } from '@common/model/query'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import { StreamUtils } from '@server/utils/streamUtils'

import * as DataTableRepository from '../repository/dataTable'
import * as DataTableInsertRepository from '../repository/dataTableInsertRepository'
import * as DataTableReadRepository from '../repository/dataTableReadRepository'
import * as DataViewRepository from '../repository/dataView'
import { SurveyRdbCsvExport } from './surveyRdbCsvExport'
import { buildDataMatrix } from './surveyRdbDataMatrix'

// ==== DDL

// schema
export { deleteRowsByRecordUuid } from '../repository/dataTableDeleteRepository'
export {
  createSchema,
  dropDataTablesAndViews,
  dropOlapDataTablesAndViews,
  dropSchema,
  selectOlapDataTablesExists,
} from '../repository/schemaRdbRepository'

// Data tables and views
export const { createDataTable, createDataTableIndexes } = DataTableRepository
export const { createDataView, countViewData, countViewDataAgg } = DataViewRepository

// Node key views
export { createNodeHierarchyDisaggregatedView } from '../repository/nodeHierarchyDisaggregatedViewRepository'
export { createNodeKeysHierarchyView } from '../repository/nodeKeysHierarchyViewRepository'
export { createNodeKeysView } from '../repository/nodeKeysViewRepository'

// Result tables and views
export { deleteNodeResultsByChainUuid, MassiveUpdateData, MassiveUpdateNodes } from '../repository/resultNode'

export { clearOlapData, createOlapDataTable, insertOlapData } from '../repository/olapDataTable'

const maxExcelCellsLimit = 1000000
const maxExcelColumnsLimit = 16384

// ==== DML

/**
 * Executes a select query on an entity definition data view.
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query to execute.
 * @param {boolean} [params.columnNodeDefs] - Whether to select only columnNodes.
 * @param {boolean} [params.includeFileAttributeDefs] - Whether to include file attribute column node defs.
 * @param {Array} [params.recordSteps] - The record steps used to filter data. If null or empty, data in all steps will be fetched.
 * @param {string} [params.recordOwnerUuid] - The record owner UUID. If null, data from all records will be fetched, otherwise only the ones owned by the specified user.
 * @param {object} [params.userGroupAccessFilters] - The user group access filters: if specified, only the records readable by the user will be fetched.
 * @param {number} [params.offset] - The query offset.
 * @param {number} [params.limit] - The query limit.
 * @param {boolean} [params.randomize] - Whether to return a random sample of rows (up to limit) always including the outliers of the first 2 numeric attributes, so large datasets can be visualized without fetching them entirely.
 * @param {boolean|object} [params.outputStream] - The output to be used to stream the data (if specified).
 * @param {string} [params.fileFormat] - The format of the output file (csv or xlsx).
 * @param {pgPromise.IDatabase} [client] - The database client.
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
    userGroupAccessFilters = null,
    offset = 0,
    limit = null,
    randomize = false,
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
      userGroupAccessFilters,
      offset,
      limit,
      randomize,
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
          options: { objectTransformer: Objects.isEmpty(transformers) ? undefined : A.pipe(...transformers) },
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
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The query object.
 * @param {number} [params.offset] - The query offset.
 * @param {string} [params.recordOwnerUuid] - The record owner UUID. If null, data from all records will be fetched, otherwise only the ones owned by the specified user.
 * @param {object} [params.userGroupAccessFilters] - The user group access filters: if specified, only the records readable by the user will be considered.
 * @param {number} [params.limit] - The query limit.
 * @param {boolean} [params.outputStream] - The output to be used to stream the data (if specified).
 * @param {object} [params.options] - Export options object (e.g. {fileFormat: 'csv'}).
 * @param {object} client - DB client.
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewDataAgg = async (params, client = db) => {
  const {
    survey,
    cycle,
    query,
    recordOwnerUuid = null,
    userGroupAccessFilters = null,
    limit,
    offset,
    outputStream = null,
    options = {},
  } = params
  const { fileFormat = FileFormats.csv } = options

  // Fetch data
  const result = await DataViewRepository.fetchViewDataAgg(
    { survey, cycle, query, recordOwnerUuid, userGroupAccessFilters, limit, offset, stream: Boolean(outputStream) },
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

const _determineRecordUuidsFilter = async ({
  survey,
  cycle,
  recordsModifiedAfter,
  recordsModifiedBefore,
  recordUuids,
  search,
  user,
}) => {
  // recordUuids explicitly selected by the user are already checked against qualifiers by
  // requireRecordsReadableByUserGroup, at the API layer
  if (recordUuids) return recordUuids

  const { own: qualifierNodeDefFilters, readable: readableQualifierNodeDefFilterSets } = user
    ? await SurveyManager.fetchUserGroupAccessFilters({ user, survey })
    : { own: [], readable: [] }

  if (
    Objects.isEmpty(search) &&
    !recordsModifiedAfter &&
    !recordsModifiedBefore &&
    qualifierNodeDefFilters.length === 0
  )
    return null

  const surveyId = Survey.getId(survey)
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
  let recordsSummaries = await RecordRepository.fetchRecordsSummaryBySurveyId({
    surveyId,
    nodeDefRoot,
    nodeDefKeys,
    cycle,
    search,
    qualifierNodeDefFilters,
    readableQualifierNodeDefFilterSets,
  })
  if (recordsModifiedAfter) {
    recordsSummaries = recordsSummaries.filter((recordSummary) =>
      Dates.isAfter(Record.getDateModified(recordSummary), recordsModifiedAfter)
    )
  }
  if (recordsModifiedBefore) {
    recordsSummaries = recordsSummaries.filter((recordSummary) =>
      Dates.isBefore(Record.getDateModified(recordSummary), recordsModifiedBefore)
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
      const { selectFields, count } = await DataViewRepository.countViewData(fetchViewDataParams, client) // NOSONAR
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
    user = null,
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
  const { recordsModifiedAfter, recordsModifiedBefore, fileFormat } = options

  const nodeDefs = getEntityDefsToExport({ survey, cycle, options })

  const filterRecordUuids = await _determineRecordUuidsFilter({
    survey,
    cycle,
    recordsModifiedAfter,
    recordsModifiedBefore,
    recordUuids: recordUuidsParam,
    search,
    user,
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
    await fetchViewData(fetchViewDataParams, client) // NOSONAR
    idx++
  }
  return { fileNamesByFileUuid: uniqueFileNamesGenerator.fileNamesByKey }
}

const getDataMatrixColumnName = ({ viewDataNodeDef, nodeDef }) => {
  const { name } = new ColumnNodeDef(viewDataNodeDef, nodeDef)
  // taxon codes cannot be used: unlisted taxa have different scientific names but the same code (e.g. UNL)
  return NodeDef.isTaxon(nodeDef) ? `${name}${ColumnNodeDef.columnSuffixTaxonScientificName}` : name
}

// all the record keys when not specified, always in the survey order
const getDataMatrixRecordKeyDefs = ({ survey, recordKeyAttributeDefUuids }) => {
  const rootKeyDefs = Survey.getNodeDefRootKeys(survey)
  if (A.isNil(recordKeyAttributeDefUuids)) return rootKeyDefs
  const rootKeyDefUuids = new Set(rootKeyDefs.map(NodeDef.getUuid))
  const invalidUuid = recordKeyAttributeDefUuids.find((uuid) => !rootKeyDefUuids.has(uuid))
  if (invalidUuid) throw new Error(`Invalid data matrix record key attribute: ${invalidUuid}`)
  return rootKeyDefs.filter((keyDef) => recordKeyAttributeDefUuids.includes(NodeDef.getUuid(keyDef)))
}

const getDataMatrixDefs = ({ survey, cycle, options }) => {
  const { entityDefUuid, rowAttributeDefUuids, valueAttributeDefUuid } = options
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  if (!entityDef || !NodeDef.isMultipleEntity(entityDef) || Objects.isEmpty(rowAttributeDefUuids)) {
    throw new Error('Invalid data matrix options')
  }
  const attributeDefs = getDataMatrixAttributeDefs({ survey, cycle, entityDef })
  const findAttributeDef = (nodeDefUuid) => {
    const attributeDef = attributeDefs.find((nodeDef) => NodeDef.getUuid(nodeDef) === nodeDefUuid)
    if (!attributeDef) throw new Error(`Invalid data matrix attribute: ${nodeDefUuid}`)
    return attributeDef
  }
  return {
    entityDef,
    keyDefs: getDataMatrixRecordKeyDefs({ survey, recordKeyAttributeDefUuids: options.recordKeyAttributeDefUuids }),
    rowDefs: rowAttributeDefUuids.map(findAttributeDef),
    valueDef: findAttributeDef(valueAttributeDefUuid),
  }
}

const checkCanExportDataMatrix = ({ fileFormat, fields, items }) => {
  const cellsCount = fields.length * (items.length + 1)
  if (
    fileFormat === FileFormats.xlsx &&
    (fields.length > maxExcelColumnsLimit || cellsCount > StreamUtils.defaultMaxCellsLimit)
  ) {
    throw new SystemError(`dataExport.excelMaxCellsLimitExceeded`, { limit: maxExcelCellsLimit })
  }
}

/**
 * Fetches the data of a multiple entity pivoted as a matrix, with one column per record.
 * @param {!object} params - The parameters.
 * @param {object} [params.user] - The user: the records of the user groups the user cannot read are excluded.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {string} [params.recordOwnerUuid] - If specified, only the records owned by this user are included.
 * @param {!object} [params.options] - The entity, row, record key (all when not specified) and value definition UUIDs, the filter expression (as in Data Explorer) and the file format.
 * @param {pgPromise.IDatabase} [client] - The database client.
 * @returns {Promise<{fields: string[], items: object[]}>} - The output fields and items.
 */
export const fetchEntityDataMatrix = async (
  { user = null, survey, cycle, recordOwnerUuid = null, options },
  client = db
) => {
  // one column per record: records of different cycles could have the same keys
  if (A.isNil(cycle)) throw new Error('Cycle not specified')

  const { entityDef, keyDefs, rowDefs, valueDef } = getDataMatrixDefs({ survey, cycle, options })

  const filterRecordUuids = await _determineRecordUuidsFilter({ survey, cycle, user })
  if (filterRecordUuids?.length === 0) {
    throw new SystemError('dataExport.noRecordsMatchingSearchCriteria')
  }

  const query = Query.assocFilter(options.filter ?? null)(
    Query.create({
      entityDefUuid: NodeDef.getUuid(entityDef),
      attributeDefUuids: [...keyDefs, ...rowDefs, valueDef].map(NodeDef.getUuid),
      filterRecordUuids,
    })
  )
  const rows = await fetchViewData({ survey, cycle, query, recordOwnerUuid }, client)

  const viewDataNodeDef = new ViewDataNodeDef(survey, entityDef)
  const getColumnName = (nodeDef) => getDataMatrixColumnName({ viewDataNodeDef, nodeDef })
  const { fields, items } = buildDataMatrix({
    rows,
    recordUuidField: ViewDataNodeDef.columnSet.recordUuid,
    recordKeyFields: keyDefs.map(getColumnName),
    rowFields: rowDefs.map(getColumnName),
    valueField: getColumnName(valueDef),
  })
  if (items.length === 0) {
    throw new SystemError('dataExport.noRecordsMatchingSearchCriteria')
  }
  checkCanExportDataMatrix({ fileFormat: options.fileFormat, fields, items })

  return { fields, items }
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

  for (const nodeDefContext of nodeDefs) {
    const childrenFileDefs = (
      NodeDef.isEntity(nodeDefContext)
        ? Survey.getNodeDefDescendantAttributesInSingleEntities({ nodeDef: nodeDefContext })(survey)
        : [nodeDefContext]
    ).filter(NodeDef.isFile)

    if (childrenFileDefs.length === 0) {
      continue
    }

    const entityDefUuid = NodeDef.getUuid(nodeDefContext)
    const query = Query.create({
      entityDefUuid,
      attributeDefUuids: childrenFileDefs.map((nd) => NodeDef.getUuid(nd)),
      filterRecordUuids,
    })

    const entityData = await fetchViewData({ survey, cycle, recordOwnerUuid, query, addCycle: true }, client) // NOSONAR
    const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDefContext)

    for (const entityRow of entityData) {
      for (const nodeDefFile of childrenFileDefs) {
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
      }
    }
  }
  return { fileUuidsByCycle, total }
}

/**
 * Counts the number of rows in the data view related to the specified query object.
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query used to filter the rows.
 * @param {string} [params.recordOwnerUuid] - If specified, only the records owned by this user are considered.
 * @param {object} [params.userGroupAccessFilters] - The user group access filters: if specified, only the records readable by the user are considered.
 * @param {pgPromise.IDatabase} client - The database client.
 * @returns {Promise<number>} - The number of rows.
 */
export const countTable = async (
  { survey, cycle, recordOwnerUuid, userGroupAccessFilters = null, query },
  client = db
) => {
  const surveyId = Survey.getId(survey)
  const nodeDefTable = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const tableName = NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey))
  const filter = Query.getFilter(query)
  return DataViewRepository.countDataTableRows(
    { surveyId, cycle, tableName, filter, recordOwnerUuid, survey, userGroupAccessFilters },
    client
  )
}

/**
 * Returns the count of rows in the data views of the specified entity defs, indexed by entity def UUID.
 * If entityDefUuids is not specified, all the entity defs will be considered.
 * @param {!object} params - The parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {string[]} [params.entityDefUuids] - The UUIDs of the entity definition data views to count.
 * @param {string} [params.recordOwnerUuid] - If specified, only the records owned by this user are considered.
 * @param {object} [params.userGroupAccessFilters] - The user group access filters: if specified, only the records readable by the user are considered.
 * @param {pgPromise.IDatabase} client - The database client.
 * @returns {Promise<object>} - Count of view data table rows indexed by related view data entity def UUID.
 */
export const fetchTableRowsCountByEntityDefUuid = async (
  { survey, cycle, entityDefUuids: entityDefUuidsParam = [], recordOwnerUuid = null, userGroupAccessFilters = null },
  client = db
) => {
  const entityDefUuids =
    entityDefUuidsParam?.length > 0
      ? entityDefUuidsParam
      : Survey.getNodeDefsArray(survey)
          .filter((nodeDef) => NodeDef.isMultipleEntity(nodeDef) && NodeDef.isInCycle(cycle)(nodeDef))
          .map(NodeDef.getUuid)

  const countsArray = await client.tx(async (tx) =>
    DbUtils.runQueries(
      tx,
      entityDefUuids.map(
        (entityDefUuid) => () =>
          countTable(
            { survey, cycle, recordOwnerUuid, userGroupAccessFilters, query: Query.create({ entityDefUuid }) },
            tx
          )
      )
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
