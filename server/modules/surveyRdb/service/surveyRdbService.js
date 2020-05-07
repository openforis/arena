import * as Survey from '@core/survey/survey'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

const _fetchSurvey = async (surveyId, cycle) => {
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById(surveyId, true))
  const loadDraftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)
  return SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, loadDraftDefs)
}

/**
 * Runs a select query on a data view associated to an entity node definition.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!NodeDef} [params.nodeDefUuidTable] - The UUID of the node def associated to the view to select.
 * @param {Array} [params.nodeDefUuidCols=[]] - The UUIDs of the node defs associated to the selected columns.
 * @param {boolean} [params.columnNodeDefs=false] - Whether to select only columnNodes.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {object} [params.filter=null] - The filter expression object.
 * @param {SortCriteria[]} [params.sort=[]] - The sort conditions.
 * @param {boolean} [params.editMode=false] - Whether to fetch row ready to be edited (fetches nodes and records).
 * @param {boolean} [params.streamOutput=null] - The output to be used to stream the data (if specified).
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

export const countTable = async (surveyId, cycle, nodeDefUuidTable, filter) => {
  const survey = await _fetchSurvey(surveyId, cycle)
  return SurveyRdbManager.countTable(survey, cycle, nodeDefUuidTable, filter)
}
