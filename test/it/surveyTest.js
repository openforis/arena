require('babel-polyfill')
require('dotenv').config()

const {initTestContext, destroyTestContext} = require('./../testContext')

const surveyTest = require('./testFiles/survey')
const nodeDefTest = require('./testFiles/nodeDef')

before(initTestContext)

describe('Survey Test', () => {

  // ==== SURVEY
  it('Create Survey', surveyTest.createSurveyTest)

  it('Create Node Defs', nodeDefTest.createNodeDefsTest)

  //it('Update Node Def', nodeDefTest.updateNodeDefTest)

})

after(destroyTestContext)