require('babel-polyfill')
require('dotenv').config()

const {initTestContext, destroyTestContext} = require('./../testContext')

const surveyTest = require('./testFiles/survey')

before(initTestContext)

describe('Survey Test', () => {

  // ==== SURVEY
  it('Create Survey', surveyTest.createSurveyTest)




})

after(destroyTestContext)