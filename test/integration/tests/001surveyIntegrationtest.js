import * as SurveyIntegrationTest from './_survey/surveyTest'
import * as CategoryTest from './_survey/categoryTest'
import * as CategoryGeoPackageExportTest from './_survey/categoryGeoPackageExportTest'
import * as NodeDefTest from './_survey/nodeDefTest'

describe('Survey Test', () => {
  // ==== SURVEY

  test('Create Survey', async () => SurveyIntegrationTest.createSurveyTest())

  test('Create Surveys Concurrently', async () => SurveyIntegrationTest.createSurveysConcurrentlyTest())

  test('Import Surveys Concurrently', async () => SurveyIntegrationTest.importSurveysConcurrentlyTest())

  test('Fetch User Surveys Info - DB Size', async () => SurveyIntegrationTest.fetchUserSurveysInfoDbSizeTest())

  // ==== CATEGORY

  test('Create Category', async () => CategoryTest.createCategoryTest())

  test('Create Category Level', async () => CategoryTest.createCategoryLevelTest())

  test('Create Category Item', async () => CategoryTest.createCategoryItemTest())

  test('Update Category', async () => CategoryTest.updateCategoryTest())

  test('Update Category Item Extra Def', async () => CategoryTest.updateCategoryItemExtraDefTest())
  test('Delete Category Item Extra Def', async () => CategoryTest.deleteCategoryItemExtraDefTest())

  test('Convert Category To GeoPackage', async () => CategoryTest.convertCategoryToGeoPackageTest())
  test('Convert Category To Sampling Point Data', async () => CategoryTest.convertCategoryToSamplingPointDataTest())
  test('Convert Category To Sampling Point Data (already converted)', async () =>
    CategoryTest.convertCategoryToSamplingPointDataAlreadyConvertedTest())
  test('Convert Category To Sampling Point Data (duplicate)', async () =>
    CategoryTest.convertCategoryToSamplingPointDataDuplicateTest())

  test('Export Category To GeoPackage', async () => CategoryGeoPackageExportTest.categoryGeoPackageExportTest())
  test('Export Category To GeoPackage (hierarchical: leaf items only)', async () =>
    CategoryGeoPackageExportTest.categoryGeoPackageExportHierarchicalTest())

  // ==== NODE DEF

  test('Create Node Defs', async () => NodeDefTest.createNodeDefsTest())

  test('Create Node Defs Expressions Fixture', async () => NodeDefTest.createExpressionsFixtureTest())

  test('Update Node Def', async () => NodeDefTest.updateNodeDefTest())
})
