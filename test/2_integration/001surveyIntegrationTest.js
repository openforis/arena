import 'dotenv/config'

import { initTestContext, destroyTestContext } from '../testContext'

import * as SurveyIntegrationTest from './surveyTests/surveyTest'
import * as CategoryTest from './surveyTests/categoryTest'
import * as NodeDefTest from './surveyTests/nodeDefTest'

before(initTestContext)

describe('Survey Test', () => {
  // ==== SURVEY

  it('Create Survey', async () => SurveyIntegrationTest.createSurveyTest())

  // ==== CATEGORY

  it('Create Category', async () => CategoryTest.createCategoryTest())

  it('Create Category Level', async () => CategoryTest.createCategoryLevelTest())

  it('Create Category Item', async () => CategoryTest.createCategoryItemTest())

  it('Update Category', async () => CategoryTest.updateCategoryTest())

  // ==== NODE DEF

  it('Create Node Defs', async () => NodeDefTest.createNodeDefsTest())

  it('Update Node Def', async () => NodeDefTest.updateNodeDefTest())
})

after(destroyTestContext)
