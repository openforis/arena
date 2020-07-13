import 'dotenv/config'

import * as SurveyIntegrationTest from './surveyTests/surveyTest'
import * as CategoryTest from './surveyTests/categoryTest'
import * as NodeDefTest from './surveyTests/nodeDefTest'

export const SurveyIntegration = async () => {
  describe('Survey Test', () => {
    // ==== SURVEY

    test('Create Survey', async () => SurveyIntegrationTest.createSurveyTest())

    // ==== CATEGORY

    test('Create Category', async () => CategoryTest.createCategoryTest())

    test('Create Category Level', async () => CategoryTest.createCategoryLevelTest())

    test('Create Category Item', async () => CategoryTest.createCategoryItemTest())

    test('Update Category', async () => CategoryTest.updateCategoryTest())

    // ==== NODE DEF

    test('Create Node Defs', async () => NodeDefTest.createNodeDefsTest())

    test('Update Node Def', async () => NodeDefTest.updateNodeDefTest())
  })
}
