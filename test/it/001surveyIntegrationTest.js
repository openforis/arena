import 'dotenv/config'

import {initTestContext, destroyTestContext} from '../testContext'

import * as SurveyIntegrationTest from './surveyTests/surveyTest'
import * as CategoryTest from './surveyTests/categoryTest'
import * as NodeDefTest from './surveyTests/nodeDefTest'

before(initTestContext)

describe('Survey Test', () => {
  // ==== SURVEY

  it('Create Survey', async () => await SurveyIntegrationTest.createSurveyTest())

  // ==== CATEGORY

  it('Create Category', async () => await CategoryTest.createCategoryTest())

  it('Create Category Level', async () => await CategoryTest.createCategoryLevelTest())

  it('Create Category Item', async () => await CategoryTest.createCategoryItemTest())

  it('Update Category', async () => await CategoryTest.updateCategoryTest())

  // ==== NODE DEF

  it('Create Node Defs', async () => await NodeDefTest.createNodeDefsTest())

  it('Update Node Def', async () => await NodeDefTest.updateNodeDefTest())
})

after(destroyTestContext)
