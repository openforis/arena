require('dotenv').config()

const {initTestContext, destroyTestContext} = require('./../testContext')

const surveyIntegrationTest = require('./surveyTests/surveyTest')
const categoryTest = require('./surveyTests/categoryTest')
const nodeDefTest = require('./surveyTests/nodeDefTest')

before(initTestContext)

describe('Survey Test', () => {

  // ==== SURVEY

  it('Create Survey', async () => await surveyIntegrationTest.createSurveyTest())

  // ==== CATEGORY

  it('Create Category', async () => await categoryTest.createCategoryTest())

  it('Create Category Level', async () => await categoryTest.createCategoryLevelTest())

  it('Create Category Item', async () => await categoryTest.createCategoryItemTest())

  it('Update Category', async () => await categoryTest.updateCategoryTest())

  // ==== NODE DEF

  it('Create Node Defs', async () => await nodeDefTest.createNodeDefsTest())

  it('Update Node Def', async () => await nodeDefTest.updateNodeDefTest())

})

after(destroyTestContext)