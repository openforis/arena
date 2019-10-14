const Survey = require('../../../../core/survey/survey')

const SurveyManager = require('../../survey/manager/surveyManager')
const SurveyRdbManager = require('../manager/surveyRdbManager')

const _getSurvey = async (surveyId, cycle) => {
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById(surveyId, true))
  const loadDraftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)
  return await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, loadDraftDefs)
}

const queryTable = async (
  surveyId, cycle, nodeDefUuidTable, nodeDefUuidCols = [],
  offset = 0, limit = null, filter = null, sort = null, editMode = false
) => {
  const survey = await _getSurvey(surveyId, cycle)
  return await SurveyRdbManager.queryTable(survey, cycle, nodeDefUuidTable, nodeDefUuidCols, offset, limit, filter, sort, editMode)
}

const countTable = async (surveyId, cycle, nodeDefUuidTable, filter) => {
  const survey = await _getSurvey(surveyId, cycle)
  return await SurveyRdbManager.countTable(survey, cycle, nodeDefUuidTable, filter)
}

module.exports = {
  queryTable,
  countTable,
}