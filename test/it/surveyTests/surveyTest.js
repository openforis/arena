const { setContextSurvey, getContextUser } = require('../../testContext')
const { assert } = require('chai')
const { uuidv4 } = require('../../../common/uuid')

const SurveyManager = require('../../../server/modules/survey/manager/surveyManager')
const Survey = require('../../../common/survey/survey')

const testSurvey = {
  name: 'test_survey_' + uuidv4(),
  label: 'Test Survey',
  lang: 'en'
}

const createSurveyTest = async () => {
  const survey = await SurveyManager.createSurvey(getContextUser(), testSurvey)

  setContextSurvey(survey)

  const surveyInfo = Survey.getSurveyInfo(survey)

  assert.equal(Survey.getName(surveyInfo), testSurvey.name)
  assert.equal(Survey.getLanguage(testSurvey.lang)(surveyInfo), testSurvey.lang)
  assert.equal(Survey.getDefaultLabel(surveyInfo), testSurvey.label)
}

// const publishSurveyTest = async () => {
//   const survey = getContextSurvey()
// }

module.exports = {
  createSurveyTest,
}