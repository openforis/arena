import * as Survey from '../../../../core/survey/survey'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as SurveyRdbManager from '../manager/surveyRdbManager'

const _fetchSurvey = async (surveyId, cycle) => {
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById(surveyId, true))
  const loadDraftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)
  return SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, loadDraftDefs)
}

/**
 * Executes a select query on an entity definition data view.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} [params.surveyId] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!string} [params.nodeDefUuidTable] - The UUID of the node def associated to the view to select.
 * @param {Array.<string>} [params.nodeDefUuidCols=[]] - The UUIDs of the node defs associated to the selected columns.
 * @param {boolean} [params.columnNodeDefs=false] - Whether to select only columnNodes.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {object} [params.filter=null] - The filter expression object.
 * @param {SortCriteria[]} [params.sort=[]] - The sort conditions.
 * @param {boolean} [params.editMode=false] - Whether to fetch row ready to be edited (fetches nodes and records).
 * @param {stream.Writable} [params.streamOutput=null] - The output to be used to stream the data (if specified).
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewData = async (params) => {
  const {
    surveyId,
    cycle,
    nodeDefUuidTable,
    nodeDefUuidCols = [],
    columnNodeDefs = false,
    offset = 0,
    limit = null,
    filter = null,
    sort = [],
    editMode = false,
    streamOutput = null,
  } = params

  const survey = await _fetchSurvey(surveyId, cycle)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  const nodeDefCols = nodeDefUuidCols.length > 0 ? Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey) : []

  return SurveyRdbManager.fetchViewData({
    survey,
    cycle,
    nodeDef,
    nodeDefCols,
    columnNodeDefs,
    offset,
    limit,
    filter,
    sort,
    editMode,
    streamOutput,
  })
}

/**
 * Counts the number of rows in an entity definition data view, filtered by the given filter object.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} [params.surveyId] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!string} [params.nodeDefUuidTable] - The UUID of the node def associated to the view to select.
 * @param {object} [params.filter=null] - The filter expression object.
 *
 * @returns {Promise<number>} - The count of rows.
 */
export const countTable = async (params) => {
  const { surveyId, cycle, nodeDefUuidTable, filter } = params
  const survey = await _fetchSurvey(surveyId, cycle)
  return SurveyRdbManager.countTable(survey, cycle, nodeDefUuidTable, filter)
}

export const { countViewDataAgg, fetchViewDataAgg } = SurveyRdbManager
