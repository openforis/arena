import * as SurveyIntegrationTest from './_survey/surveyTest'
import * as CategoryTest from './_survey/categoryTest'
import * as NodeDefTest from './_survey/nodeDefTest'

describe('Survey Test', () => {
  // ==== SURVEY

  test('Create Survey', async () => SurveyIntegrationTest.createSurveyTest())

  // ==== CATEGORY

  test('Create Category', async () => CategoryTest.createCategoryTest())

  test('Create Category Level', async () => CategoryTest.createCategoryLevelTest())

  test('Create Category Item', async () => CategoryTest.createCategoryItemTest())

  test('Update Category', async () => CategoryTest.updateCategoryTest())

  test('Update Category Item Extra Def', async () => CategoryTest.updateCategoryItemExtraDefTest())

  // ==== NODE DEF

  test('Create Node Defs', async () => NodeDefTest.createNodeDefsTest())

  test('Update Node Def', async () => NodeDefTest.updateNodeDefTest())
})
