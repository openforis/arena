import * as Survey from '../../../../core/survey/survey'
import { Query } from '../../../../common/model/query'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as SurveyRdbManager from '../manager/surveyRdbManager'

const _fetchSurvey = async (surveyId, cycle) => {
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById(surveyId, true))
  const loadDraftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)
  return SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft: loadDraftDefs })
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
 * @param {stream.Writable} [params.streamOutput=null] - The output to be used to stream the data (if specified).
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewData = async (params) => {
  const { surveyId, cycle, query, offset = 0, limit = null, columnNodeDefs = false, streamOutput = null } = params

  const survey = await _fetchSurvey(surveyId, cycle)

  return Query.isModeAggregate(query)
    ? SurveyRdbManager.fetchViewDataAgg({ survey, cycle, query, offset, limit, stream: Boolean(streamOutput) })
    : SurveyRdbManager.fetchViewData({ survey, cycle, query, columnNodeDefs, offset, limit, streamOutput })
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
