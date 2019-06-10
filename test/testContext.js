const { deleteSurvey } = require('../server/modules/survey/manager/surveyManager')

const { findUserByEmailAndPassword } = require('../server/modules/user/service/userService')
const { setUserPref, userPrefNames } = require('../common/user/userPrefs')

const Survey = require('../common/survey/survey')

const SurveyManager = require('../server/modules/survey/manager/surveyManager')

let user = null
let survey = null

/**
 * Initializing test context (user)
 * before executing all tests
 */
const initTestContext = async () => {
  user = await findUserByEmailAndPassword('admin@openforis.org', 'admin')
}

const destroyTestContext = async () => {
  if (survey)
    await deleteSurvey(Survey.getId(survey), user)
}

const setContextSurvey = s => {
  survey = s
  user = setUserPref(userPrefNames.survey, Survey.getId(survey))(user)
}

const fetchFullContextSurvey = async (draft = true, advanced = true) =>
  await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(Survey.getId(survey), draft, advanced)

module.exports = {
  initTestContext,
  destroyTestContext,

  getContextUser: () => user,

  getContextSurvey: () => survey,
  fetchFullContextSurvey,
  getContextSurveyId: () => Survey.getId(survey),
  setContextSurvey
}

