const db = require('../server/db/db')

const {deleteSurvey} = require('../server/survey/surveyManager')

const {findUserByEmailAndPassword} = require('../server/user/userManager')
const {setUserPref, userPrefNames} = require('../common/user/userPrefs')

const Survey = require('../common/survey/survey')

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
  await deleteSurvey(survey.info.id, user)
}

const setContextSurvey = s => {
  survey = s
  user = setUserPref(userPrefNames.survey, survey.id)(user)
}

module.exports = {
  initTestContext,
  destroyTestContext,

  getContextUser: () => user,

  getContextSurvey: () => survey,
  getContextSurveyId: () => Survey.getSurveyInfo(survey).id,
  setContextSurvey
}

