require('dotenv').config()
// const R = require('ramda')

const {initTestContext, destroyTestContext} = require('./../testContext')

const surveyIntegrationTest = require('./surveyTests/surveyTest')
const categoryTest = require('./surveyTests/categoryTest')
const nodeDefTest = require('./surveyTests/nodeDefTest')
const nodeDefExpressionTest = require('./surveyTests/nodeDefExpressionTest')

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

  // ==== NODE DEF EXPRESSIONS
  it('Test "this" expression validation', nodeDefExpressionTest.validateThisExpressionTest)

  it('Test binary expression validation', nodeDefExpressionTest.validateBinaryExpressionTest)

  it('Test "parent()" expression validation', nodeDefExpressionTest.validateParentExpressionTest)

  it('Test "node()" expression validation', nodeDefExpressionTest.validateNodeExpressionTest)

  it('Test "sibling()" expression validation', nodeDefExpressionTest.validateSiblingExpressionTest)

  it('Test syntax error validation', nodeDefExpressionTest.validateSyntaxErrorTest)

  it('Test invalid node expression validation', nodeDefExpressionTest.validateInvalidNodeExpressionTest)

  it('Test invalid node expression on attribute validation', nodeDefExpressionTest.validateInvalidNodeExpressionOnAttributeTest)

  it('Test invalid sibling expression validation', nodeDefExpressionTest.validateInvaldSiblingExpressionTest)

})

after(destroyTestContext)