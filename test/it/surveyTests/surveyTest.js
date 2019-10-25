const { setContextSurvey, getContextUser } = require('../../testContext')
const { assert } = require('chai')
const { uuidv4 } = require('@core/uuid')

const SurveyManager = require('@server/modules/survey/manager/surveyManager')
const Survey = require('@core/survey/survey')

const testSurvey = {
  name: 'test_survey_' + uuidv4(),
  label: 'Test Survey',
  languages: ['en']
}

const createSurveyTest = async () => {
  const survey = await SurveyManager.createSurvey(getContextUser(), testSurvey)

  setContextSurvey(survey)

  const surveyInfo = Survey.getSurveyInfo(survey)

  assert.equal(Survey.getName(surveyInfo), testSurvey.name)
  const expectedDefaultLanguage = testSurvey.languages[0]
  assert.equal(Survey.getLanguage(expectedDefaultLanguage)(surveyInfo), expectedDefaultLanguage)
  assert.equal(Survey.getDefaultLabel(surveyInfo), testSurvey.label)
}

// const publishSurveyTest = async () => {
//   const survey = getContextSurvey()
// }

module.exports = {
  createSurveyTest,
}