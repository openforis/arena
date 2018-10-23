const db = require('../server/db/db')

const {findUserByEmailAndPassword} = require('../server/user/userRepository')
const {deleteSurvey} = require('../server/survey/surveyManager')

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
  await deleteSurvey(survey.id, user)
}

module.exports = {
  initTestContext,
  destroyTestContext,

  getContextUser: () => user,

  getContextSurvey: () => survey,
  setContextSurvey: s => survey = s,
}

