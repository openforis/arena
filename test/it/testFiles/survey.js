const {setContextSurvey, getContextUser, getContextSurvey} = require('./../../testContext')
const {assert, expect} = require('chai')
const {uuidv4} = require('../../../common/uuid')

const {createSurvey} = require('../../../server/survey/surveyManager')
const {
  getName,
  getDefaultLabel,
  getDefaultLanguage,
} = require('../../../common/survey/survey')

const testSurvey = {
  name: 'test_survey_' + uuidv4(),
  label: 'Test Survey',
  lang: 'en'
}

const createSurveyTest = async () => {

  const survey = await createSurvey(getContextUser(), testSurvey)
  setContextSurvey(survey)

  assert.equal(getName(survey), testSurvey.name)
  assert.equal(getDefaultLanguage(survey), testSurvey.lang)
  assert.equal(getDefaultLabel(survey), testSurvey.label)
}

// const publishSurveyTest = async () => {
//   const survey = getContextSurvey()
// }

module.exports = {
  createSurveyTest,
}