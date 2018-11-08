require('dotenv').config()
// const R = require('ramda')

const {initTestContext, destroyTestContext} = require('./../testContext')

const surveyIntegrationTest = require('./surveyTests/surveyTest')
const nodeDefTest = require('./surveyTests/nodeDefTest')
const codeListTest = require('./surveyTests/codeListTest')

before(initTestContext)

describe('Survey Test', () => {

  // ==== SURVEY

  it('Create Survey', surveyIntegrationTest.createSurveyTest)

  // ==== CODE LIST

  it('Create Code List', codeListTest.createCodeListTest)

  it('Create Code List Level', codeListTest.createCodeListLevelTest)

  it('Create Code List Item', codeListTest.createCodeListItemTest)

  it('Update Code List', codeListTest.updateCodeListTest)

  // ==== NODE DEF

  it('Create Node Defs', nodeDefTest.createNodeDefsTest)

  it('Update Node Def', nodeDefTest.updateNodeDefTest)

})

after(destroyTestContext)