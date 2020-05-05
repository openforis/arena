import * as Survey from '@core/survey/survey'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

const _fetchSurvey = async (surveyId, cycle) => {
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById(surveyId, true))
  const loadDraftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)
  return SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, loadDraftDefs)
}

export const queryTable = async (
  surveyId,
  cycle,
  nodeDefUuidTable,
  nodeDefUuidCols = [],
  offset = 0,
  limit = null,
  filter = null,
  sort = [],
  editMode = false,
  streamOutput = null
) => {
  const survey = await _fetchSurvey(surveyId, cycle)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  const nodeDefCols = nodeDefUuidCols ? Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey) : []

  return SurveyRdbManager.queryTable(
    survey,
    cycle,
    nodeDef,
    nodeDefCols,
    offset,
    limit,
    filter,
    sort,
    editMode,
    streamOutput
  )
}

export const countTable = async (surveyId, cycle, nodeDefUuidTable, filter) => {
  const survey = await _fetchSurvey(surveyId, cycle)
  return SurveyRdbManager.countTable(survey, cycle, nodeDefUuidTable, filter)
}
