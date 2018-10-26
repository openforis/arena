const {setContextSurvey, getContextUser, getContextSurvey} = require('./../../testContext')
const {assert, expect} = require('chai')
const {uuidv4} = require('../../../common/uuid')

const {createSurvey} = require('../../../server/survey/surveyManager')
const {
  getSurveyName,
  getSurveyDefaultLabel,
  getSurveyDefaultLanguage,
} = require('../../../common/survey/survey')

const testSurvey = {
  name: 'test_survey_' + uuidv4(),
  label: 'Test Survey',
  lang: 'en'
}

const createSurveyTest = async () => {

  const survey = await createSurvey(getContextUser(), testSurvey)
  setContextSurvey(survey)

  assert.equal(getSurveyName(survey), testSurvey.name)
  assert.equal(getSurveyDefaultLanguage(survey), testSurvey.lang)
  assert.equal(getSurveyDefaultLabel(survey), testSurvey.label)
}

// const publishSurveyTest = async () => {
//   const survey = getContextSurvey()
// }

module.exports = {
  createSurveyTest,
}