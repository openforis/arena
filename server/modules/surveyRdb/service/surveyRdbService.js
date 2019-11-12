import * as Survey from '@core/survey/survey'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as SurveyRdbManager from '../manager/surveyRdbManager'

const _fetchSurvey = async (surveyId, cycle) => {
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById(surveyId, true))
  const loadDraftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)
  return await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, loadDraftDefs)
}

export const queryTable = async (
  surveyId, cycle, nodeDefUuidTable, nodeDefUuidCols = [],
  offset = 0, limit = null, filter = null, sort = [],
  editMode = false, streamOutput = null
) => {
  const survey = await _fetchSurvey(surveyId, cycle)
  return await SurveyRdbManager.queryTable(survey, cycle, nodeDefUuidTable, nodeDefUuidCols, offset, limit, filter, sort, editMode, streamOutput)
}

export const countTable = async (surveyId, cycle, nodeDefUuidTable, filter) => {
  const survey = await _fetchSurvey(surveyId, cycle)
  return await SurveyRdbManager.countTable(survey, cycle, nodeDefUuidTable, filter)
}
