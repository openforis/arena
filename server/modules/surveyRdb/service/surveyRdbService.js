import * as A from '@core/arena'
import { Query } from '../../../../common/model/query'

import { Authorizer } from '@openforis/arena-core'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as User from '@core/user/user'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as SurveyRdbManager from '../manager/surveyRdbManager'
import * as NodeDefManager from '../../nodeDef/manager/nodeDefManager'

import * as Log from '@server/log/log'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'

import SurveysRdbRefreshJob from './SurveysRdbRefreshJob'
import { FileFormats, getExtensionByFileFormat } from '@core/fileFormats'

const Logger = Log.getLogger('SurveyRdbService')

// promises of the surveys being fetched, indexed by fetch parameters;
// concurrent requests (e.g. data explorer data and count requests coming from many users at the same time)
// share the same fetch instead of loading the same survey from the DB multiple times
const surveyFetchPromisesByKey = new Map()

const _doFetchSurvey = async ({ surveyId, cycle, includeRefData, draft }) => {
  const params = { surveyId, cycle, draft, advanced: true }
  return includeRefData
    ? SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
        ...params,
        includeBigCategories: false,
        includeBigTaxonomies: false,
      })
    : SurveyManager.fetchSurveyAndNodeDefsBySurveyId(params)
}

/**
 * Fetches the survey used to run queries on the data views.
 * Concurrent calls with the same parameters share the same (in-progress) fetch.
 * @param {!object} params - The fetch parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {string} [params.cycle] - The survey cycle.
 * @param {boolean} [params.includeRefData] - Whether to include categories and taxonomies reference data (needed only when exporting data).
 * @param {boolean} [params.draft] - Whether to load draft node defs (needed for custom aggregate functions).
 * @returns {Promise<object>} - The fetched survey.
 */
const _fetchSurvey = async ({ surveyId, cycle, includeRefData = false, draft = true }) => {
  const key = `${surveyId}_${cycle}_${includeRefData}_${draft}`
  let fetchPromise = surveyFetchPromisesByKey.get(key)
  if (!fetchPromise) {
    fetchPromise = _doFetchSurvey({ surveyId, cycle, includeRefData, draft }).finally(() => {
      surveyFetchPromisesByKey.delete(key)
    })
    surveyFetchPromisesByKey.set(key, fetchPromise)
  }
  return fetchPromise
}

const _getRecordOwnerUuidForQuery = ({ user, survey }) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  return Authorizer.canViewNotOwnedRecords(user, surveyInfo)
    ? null // fetch all records' data
    : User.getUuid(user) // fetch only owned records' data
}

/**
 * Determines the qualifier filters of the user's group and of the groups it can read (see SurveyManager.fetchUserGroupAccessFilters).
 * @param {!object} params - The parameters.
 * @param {object} [params.user] - The user running the query.
 * @param {!object} params.survey - The survey used to run the query.
 * @param {string} [params.cycle] - The survey cycle.
 * @returns {Promise<{own: Array, readable: Array}>} - The access filters (`own` is empty when the user is not restricted).
 */
const _fetchUserGroupAccessFilters = async ({ user, survey, cycle }) => {
  if (!user) return { own: [], readable: [] }
  const surveyInfo = Survey.getSurveyInfo(survey)
  // same node defs used to generate the data views and to filter the records list (draft only if not published yet)
  const draft = (Survey.isFromCollect(surveyInfo) || Survey.isFromOdk(surveyInfo)) && !Survey.isPublished(surveyInfo)
  const surveyForAccessFilters = await _fetchSurvey({ surveyId: Survey.getId(survey), cycle, draft })
  return SurveyManager.fetchUserGroupAccessFilters({ user, survey: surveyForAccessFilters })
}

// export options that can be specified by the client: the other query parameters are determined server-side
const exportOptionKeys = [
  'fileFormat',
  'includeCategoryItemsLabels',
  'expandCategoryItems',
  'includeInternalUuids',
  'includeDateCreated',
  'includeFileAttributeDefs',
  'nullsToEmpty',
]

const _pickExportOptions = (options) =>
  options && typeof options === 'object' ? A.pick(exportOptionKeys, options) : {}

/**
 * Executes a select query on an entity definition data view, only on the records readable by the user.
 * @param {!object} params - The query parameters.
 * @param {object} [params.user] - The user running the query.
 * @param {!string} [params.surveyId] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query to execute.
 * @param {number} [params.offset] - The query offset.
 * @param {number} [params.limit] - The query limit.
 * @param {boolean} [params.randomize] - Whether to return a random sample of rows (up to limit) always including outliers (used by the scatter chart). Applied only in raw mode.
 * @param {Stream.Writable} [params.outputStream] - The output to be used to stream the data (if specified).
 * @param {object} [params.options] - The export options (only the ones in exportOptionKeys are considered).
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewData = async (params) => {
  const {
    user,
    surveyId,
    cycle,
    query,
    offset = 0,
    limit = null,
    randomize = false,
    columnNodeDefs = false,
    outputStream = null,
    addCycle = false,
    options = {},
  } = params

  let parsedQuery = query
  if (typeof query === 'string') {
    parsedQuery = A.parse(query)
  }
  // reference data (category items, taxa) is needed only to write category item labels in exported files
  const includeRefData = Boolean(outputStream)
  const survey = await _fetchSurvey({ surveyId, cycle, includeRefData })
  const recordOwnerUuid = _getRecordOwnerUuidForQuery({ user, survey })
  const userGroupAccessFilters = await _fetchUserGroupAccessFilters({ user, survey, cycle })
  const exportOptions = _pickExportOptions(options)

  const data = Query.isModeAggregate(parsedQuery)
    ? await SurveyRdbManager.fetchViewDataAgg({
        survey,
        cycle,
        query,
        recordOwnerUuid,
        userGroupAccessFilters,
        offset,
        limit,
        outputStream,
        options: exportOptions,
      })
    : await SurveyRdbManager.fetchViewData({
        ...exportOptions,
        survey,
        cycle,
        query,
        columnNodeDefs,
        recordOwnerUuid,
        userGroupAccessFilters,
        offset,
        limit,
        // sampling is meant only for the scatter chart (raw mode)
        randomize: randomize && Query.isModeRaw(parsedQuery),
        outputStream,
        addCycle,
      })

  return data
}

/**
 * Counts the number of rows in an entity definition data view, filtered by the given filter object, only in the records readable by the user.
 * @param {!object} params - The query parameters.
 * @param {object} [params.user] - The user running the query.
 * @param {!string} [params.surveyId] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query used to filter the records.
 * @returns {Promise<number>} - The count of rows.
 */
export const countTable = async (params) => {
  const { user, surveyId, cycle, query } = params

  const survey = await _fetchSurvey({ surveyId, cycle })
  const recordOwnerUuid = _getRecordOwnerUuidForQuery({ user, survey })
  const userGroupAccessFilters = await _fetchUserGroupAccessFilters({ user, survey, cycle })

  return Query.isModeAggregate(query)
    ? SurveyRdbManager.countViewDataAgg({ survey, cycle, recordOwnerUuid, userGroupAccessFilters, query })
    : SurveyRdbManager.countTable({ survey, cycle, recordOwnerUuid, userGroupAccessFilters, query })
}

/**
 * Counts the rows in the data views of the specified entity definitions, only in the records readable by the user.
 * @param {!object} params - The parameters.
 * @param {!object} params.user - The user.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string} params.cycle - The survey cycle.
 * @param {string[]} [params.entityDefUuids] - The entity definition UUIDs (all multiple entities if empty).
 * @returns {Promise<object>} - The count of rows indexed by entity definition UUID.
 */
export const fetchTableRowsCountByEntityDefUuid = async ({ user, surveyId, cycle, entityDefUuids = [] }) => {
  const survey = await _fetchSurvey({ surveyId, cycle })
  const recordOwnerUuid = _getRecordOwnerUuidForQuery({ user, survey })
  const userGroupAccessFilters = await _fetchUserGroupAccessFilters({ user, survey, cycle })

  return SurveyRdbManager.fetchTableRowsCountByEntityDefUuid({
    survey,
    cycle,
    entityDefUuids,
    recordOwnerUuid,
    userGroupAccessFilters,
  })
}

export const refreshAllRdbs = async () => {
  const surveySummaries = await SurveyManager.fetchSurveyIdsAndNames()
  const surveyIds = surveySummaries
    .filter((surveySummary) => surveySummary.published || surveySummary.collectUri)
    .map((surveySummary) => surveySummary.id)

  const job = new SurveysRdbRefreshJob({ surveyIds })
  JobManager.enqueueJob(job)

  return { job: JobUtils.jobToJSON(job) }
}

export const exportViewDataToTempFile = async ({
  user,
  surveyId,
  cycle,
  query,
  columnNodeDefs = false,
  addCycle = false,
  options = {},
}) => {
  const tempFileName = FileUtils.newTempFileName()
  const tempFilePath = FileUtils.tempFilePath(tempFileName)
  const outputStream = FileUtils.createWriteStream(tempFilePath)

  await fetchViewData({ user, surveyId, cycle, query, columnNodeDefs, outputStream, addCycle, options })

  return tempFileName
}

export const exportDataMatrixToTempFile = async ({ user, survey, cycle, options }, client) => {
  const { fileFormat } = options
  const recordOwnerUuid = _getRecordOwnerUuidForQuery({ user, survey })

  const { fields, items } = await SurveyRdbManager.fetchEntityDataMatrix(
    { user, survey, cycle, recordOwnerUuid, options },
    client
  )

  const tempFileName = FileUtils.newTempFileName()
  const outputStream = FileUtils.createWriteStream(FileUtils.tempFilePath(tempFileName))
  await FlatDataWriter.writeItemsToStream({ outputStream, fileFormat, fields, items })

  return tempFileName
}

export const fetchEntitiesDataToCsvFiles = async ({
  user,
  survey,
  cycle: cycleParam,
  recordUuids,
  search,
  options,
  outputDir,
  callback,
}) => {
  const recordOwnerUuid = _getRecordOwnerUuidForQuery({ user, survey })

  const { includeDataFromAllCycles } = options
  const cycle = includeDataFromAllCycles ? null : cycleParam

  const surveyId = Survey.getId(survey)
  const hasUserDependentExpressions = await NodeDefManager.fetchSurveyHasUserDependentExpressions({ surveyId })
  if (hasUserDependentExpressions) {
    // KNOWN LIMITATION: exported values reflect the applicability persisted by whichever
    // user last edited each record, not necessarily the current exporting user's view.
    // A full per-record, per-exporting-user correction is not implemented yet.
    Logger.warn(
      `survey ${surveyId} uses user-dependent expressions (e.g. userProp); ` +
        'exported data reflects persisted applicability from the last editing user, not the exporting user'
    )
  }

  return SurveyRdbManager.fetchEntitiesDataToCsvFiles({
    user,
    survey,
    cycle,
    outputDir,
    recordUuids,
    recordOwnerUuid,
    search,
    options,
    callback,
  })
}

export const fetchEntitiesFileUuidsByCycle = async ({
  user,
  survey,
  cycle: cycleParam,
  includeDataFromAllCycles,
  filterRecordUuids,
  callback,
}) => {
  const recordOwnerUuid = _getRecordOwnerUuidForQuery({ user, survey })

  const cycle = includeDataFromAllCycles ? null : cycleParam

  return SurveyRdbManager.fetchEntitiesFileUuidsByCycle({
    survey,
    cycle,
    recordOwnerUuid,
    filterRecordUuids,
    callback,
  })
}

export const fetchEntitiesDataSummaryToFlatData = async ({ exportUuid, survey, cycle, lang, options }) => {
  const { fileFormat = FileFormats.xlsx } = options
  const items = []
  const entityDefs = SurveyRdbManager.getEntityDefsToExport({ survey, cycle, options })
  for (const entityDef of entityDefs) {
    const entityDefUuid = NodeDef.getUuid(entityDef)
    const query = Query.create({ entityDefUuid })
    const count = await SurveyRdbManager.countTable({ survey, cycle, query }) // NOSONAR
    items.push({ name: NodeDef.getName(entityDef), label: NodeDef.getLabel(entityDef, lang), count })
  }
  const tempFilePath = FileUtils.tempFilePath(`${exportUuid}.${getExtensionByFileFormat(fileFormat)}`)
  const outputStream = FileUtils.createWriteStream(tempFilePath)
  await FlatDataWriter.writeItemsToStream({ outputStream, fileFormat, items })
}
