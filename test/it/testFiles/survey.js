const {setContextSurvey, getContextUser, getContextSurvey} = require('./../../testContext')
const {assert, expect} = require('chai')
const {uuidv4} = require('../../../common/uuid')

const {createSurvey} = require('../../../server/survey/surveyManager')
const Survey = require('../../../common/survey/survey')

const testSurvey = {
  name: 'test_survey_' + uuidv4(),
  label: 'Test Survey',
  lang: 'en'
}

const createSurveyTest = async () => {

  const survey = await createSurvey(getContextUser(), testSurvey)

  setContextSurvey(survey)

  const surveyInfo = Survey.getSurveyInfo(survey)

  assert.equal(Survey.getName(surveyInfo), testSurvey.name)
  assert.equal(Survey.getDefaultLanguage(surveyInfo), testSurvey.lang)
  assert.equal(Survey.getDefaultLabel(surveyInfo), testSurvey.label)
}

// const publishSurveyTest = async () => {
//   const survey = getContextSurvey()
// }

module.exports = {
  createSurveyTest,
}