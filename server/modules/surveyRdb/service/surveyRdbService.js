import * as A from '@core/arena'
import { Query } from '../../../../common/model/query'

import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as User from '@core/user/user'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as SurveyRdbManager from '../manager/surveyRdbManager'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'

import SurveysRdbRefreshJob from './SurveysRdbRefreshJob'
import { FileFormats, getExtensionByFileFormat } from '@core/fileFormats'

const _fetchSurvey = async ({ surveyId, cycle }) => {
  const draft = true // always load draft node defs (needed for custom aggregate functions)
  return SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId,
    cycle,
    draft,
    advanced: true,
    includeBigCategories: false,
    includeBigTaxonomies: false,
  })
}

const _getRecordOwnerUuidForQuery = ({ user, survey }) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  return Authorizer.canExportAllRecords(user, surveyInfo)
    ? null // fetch all records' data
    : User.getUuid(user) // fetch only owned records' data
}

/**
 * Executes a select query on an entity definition data view.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} [params.surveyId] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query to execute.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {Stream.Writable} [params.outputStream=null] - The output to be used to stream the data (if specified).
 *
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
    columnNodeDefs = false,
    outputStream = null,
    addCycle = false,
    options = {},
  } = params

  let parsedQuery = query
  if (typeof query === 'string') {
    parsedQuery = A.parse(query)
  }
  const survey = await _fetchSurvey({ surveyId, cycle })
  const recordOwnerUuid = _getRecordOwnerUuidForQuery({ user, survey })

  const data = Query.isModeAggregate(parsedQuery)
    ? await SurveyRdbManager.fetchViewDataAgg({
        survey,
        cycle,
        query,
        recordOwnerUuid,
        offset,
        limit,
        outputStream,
        options,
      })
    : await SurveyRdbManager.fetchViewData({
        survey,
        cycle,
        query,
        columnNodeDefs,
        recordOwnerUuid,
        offset,
        limit,
        outputStream,
        addCycle,
        ...options,
      })

  return data
}

/**
 * Counts the number of rows in an entity definition data view, filtered by the given filter object.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} [params.surveyId] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query used to filter the records.
 *
 * @returns {Promise<number>} - The count of rows.
 */
export const countTable = async (params) => {
  const { user, surveyId, cycle, query } = params

  const survey = await _fetchSurvey({ surveyId, cycle })
  const recordOwnerUuid = _getRecordOwnerUuidForQuery({ user, survey })

  return Query.isModeAggregate(query)
    ? SurveyRdbManager.countViewDataAgg({ survey, cycle, recordOwnerUuid, query })
    : SurveyRdbManager.countTable({ survey, cycle, recordOwnerUuid, query })
}

export const fetchTableRowsCountByEntityDefUuid = async ({ surveyId, cycle, entityDefUuids = [] }) => {
  const survey = await _fetchSurvey({ surveyId, cycle })

  return SurveyRdbManager.fetchTableRowsCountByEntityDefUuid({ survey, cycle, entityDefUuids })
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

  return SurveyRdbManager.fetchEntitiesDataToCsvFiles({
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
    const count = await SurveyRdbManager.countTable({ survey, cycle, query })
    items.push({ name: NodeDef.getName(entityDef), label: NodeDef.getLabel(entityDef, lang), count })
  }
  const tempFilePath = FileUtils.tempFilePath(`${exportUuid}.${getExtensionByFileFormat(fileFormat)}`)
  const outputStream = FileUtils.createWriteStream(tempFilePath)
  await FlatDataWriter.writeItemsToStream({ outputStream, fileFormat, items })
}
