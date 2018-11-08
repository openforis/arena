const {setContextSurvey, getContextUser, getContextSurvey} = require('./../../testContext')
const {assert, expect} = require('chai')
const {uuidv4} = require('../../../common/uuid')

const {createSurvey} = require('../../../server/survey/surveyManager')
const SurveyTest = require('../../../common/survey/survey')

const testSurvey = {
  name: 'test_survey_' + uuidv4(),
  label: 'Test Survey',
  lang: 'en'
}

const createSurveyTest = async () => {

  const survey = await createSurvey(getContextUser(), testSurvey)

  setContextSurvey(survey)

  const surveyInfo = SurveyTest.getSurveyInfo(survey)

  assert.equal(SurveyTest.getName(surveyInfo), testSurvey.name)
  assert.equal(SurveyTest.getDefaultLanguage(surveyInfo), testSurvey.lang)
  assert.equal(SurveyTest.getDefaultLabel(surveyInfo), testSurvey.label)
}

// const publishSurveyTest = async () => {
//   const survey = getContextSurvey()
// }

module.exports = {
  createSurveyTest,
}