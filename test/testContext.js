const {deleteSurvey} = require('../server/survey/surveyManager')

const {findUserByEmailAndPassword} = require('../server/user/userManager')
const {setUserPref, userPrefNames} = require('../common/user/userPrefs')

const Survey = require('../common/survey/survey')

const SurveyManager = require('../server/survey/surveyManager')

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
  await deleteSurvey(Survey.getId(survey), user)
}

const setContextSurvey = s => {
  survey = s
  user = setUserPref(userPrefNames.survey, Survey.getId(survey))(user)
}

const fetchFullContextSurvey = async() =>
  await SurveyManager.fetchSurveyById(Survey.getId(survey))

module.exports = {
  initTestContext,
  destroyTestContext,

  getContextUser: () => user,

  getContextSurvey: () => survey,
  fetchFullContextSurvey,
  getContextSurveyId: () => Survey.getId(survey),
  setContextSurvey
}

