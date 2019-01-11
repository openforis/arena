require('dotenv').config()
// const R = require('ramda')

const {initTestContext, destroyTestContext} = require('./../testContext')

const surveyIntegrationTest = require('./surveyTests/surveyTest')
const categoryTest = require('./surveyTests/categoryTest')
const nodeDefTest = require('./surveyTests/nodeDefTest')

before(initTestContext)

describe('Survey Test', () => {

  // ==== SURVEY

  it('Create Survey', surveyIntegrationTest.createSurveyTest)

  // ==== CATEGORY

  it('Create Category', categoryTest.createCategoryTest)

  it('Create Category Level', categoryTest.createCategoryLevelTest)

  it('Create Category Item', categoryTest.createCategoryItemTest)

  it('Update Category', categoryTest.updateCategoryTest)

  // ==== NODE DEF

  it('Create Node Defs', nodeDefTest.createNodeDefsTest)

  it('Update Node Def', nodeDefTest.updateNodeDefTest)

  it('Update Node Def advanced props', nodeDefTest.updateNodeDefAdvancedPropsTest)

})

after(destroyTestContext)