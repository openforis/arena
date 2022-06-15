import { Query } from '../../../../common/model/query'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as SurveyRdbManager from '../manager/surveyRdbManager'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'

import SurveysRdbRefreshJob from './SurveysRdbRefreshJob'

const _fetchSurvey = async (surveyId, cycle) => {
  const draft = true // always load draft node defs (needed for custom aggregate functions)
  return SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft, advanced: true })
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
 * @param {Stream.Writable} [params.streamOutput=null] - The output to be used to stream the data (if specified).
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewData = async (params) => {
  const {
    surveyId,
    cycle,
    query,
    offset = 0,
    limit = null,
    columnNodeDefs = false,
    streamOutput = null,
    addCycle = false,
  } = params

  const survey = await _fetchSurvey(surveyId, cycle)

  return Query.isModeAggregate(query)
    ? SurveyRdbManager.fetchViewDataAgg({ survey, cycle, query, offset, limit, streamOutput })
    : SurveyRdbManager.fetchViewData({ survey, cycle, query, columnNodeDefs, offset, limit, streamOutput, addCycle })
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
  const { surveyId, cycle, query } = params

  const survey = await _fetchSurvey(surveyId, cycle)

  return Query.isModeAggregate(query)
    ? SurveyRdbManager.countViewDataAgg({ survey, cycle, query })
    : SurveyRdbManager.countTable({ survey, cycle, query })
}

export const countTables = async (params) => {
  const { surveyId, cycle, entityDefUuids = [] } = params

  const survey = await _fetchSurvey(surveyId, cycle)

  return SurveyRdbManager.countTables({ survey, cycle, entityDefUuids })
}

export const refreshAllRdbs = async () => {
  const surveySummaries = await SurveyManager.fetchSurveyIdsAndNames()
  const surveyIds = surveySummaries
    .filter((surveySummary) => surveySummary.published || surveySummary.collectUri)
    .map((surveySummary) => surveySummary.id)

  const job = new SurveysRdbRefreshJob({ surveyIds })
  JobManager.executeJobThread(job)

  return { job: JobUtils.jobToJSON(job) }
}

export const exportViewDataToTempFile = async (params) => {
  const { surveyId, cycle, query, columnNodeDefs = false, addCycle = false } = params

  const tempFileName = FileUtils.newTempFileName()
  const tempFilePath = FileUtils.tempFilePath(tempFileName)
  const streamOutput = FileUtils.createWriteStream(tempFilePath)

  await fetchViewData({ surveyId, cycle, query, columnNodeDefs, streamOutput, addCycle })

  return tempFileName
}
