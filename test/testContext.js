const Survey = require('../common/survey/survey')

const SurveyManager = require('../server/modules/survey/manager/surveyManager')
const UserManager = require('../server/modules/user/manager/userManager')

const { setUserPref, userPrefNames } = require('../common/user/userPrefs')

let user = null
let survey = null

/**
 * Initializing test context (user)
 * before executing all tests
 */
const initTestContext = async () => {
  user = await UserManager.fetchUserByEmail('admin@openforis.org')
}

const destroyTestContext = async () => {
  if (survey)
    await SurveyManager.deleteSurvey(Survey.getId(survey))
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
