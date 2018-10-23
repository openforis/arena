require('babel-polyfill')
require('dotenv').config()

const {assert, expect} = require('chai')

const {initTestContext, destroyTestContext, setContextSurvey, getContextUser} = require('./../testContext')

const {createSurvey} = require('../../server/survey/surveyRepository')
const {getSurveyName, getSurveyDefaultLabel, getSurveyDefaultLanguage} = require('../../common/survey/survey')

before(initTestContext)

describe('Survey Test', () => {

  it('Create Survey', async () => {

    const testSurvey = {name: 'test_survey_moooooo', label: 'Test Survey', lang: 'en'}
    const survey = await createSurvey(getContextUser(), testSurvey)
    setContextSurvey(survey)

    assert.equal(getSurveyName(survey), testSurvey.name)
    assert.equal(getSurveyDefaultLanguage(survey), testSurvey.lang)
    assert.equal(getSurveyDefaultLabel(survey), testSurvey.label)
  })

})

after(destroyTestContext)