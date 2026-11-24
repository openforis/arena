import * as SurveyIntegrationTest from './_survey/surveyTest'
import * as CategoryTest from './_survey/categoryTest'
import * as CategoryGeoPackageExportTest from './_survey/categoryGeoPackageExportTest'
import * as NodeDefTest from './_survey/nodeDefTest'

describe('Survey Test', () => {
  // ==== SURVEY

  test('Create Survey', () => SurveyIntegrationTest.createSurveyTest())

  test('Create Surveys Concurrently', () => SurveyIntegrationTest.createSurveysConcurrentlyTest())

  test('Import Surveys Concurrently', () => SurveyIntegrationTest.importSurveysConcurrentlyTest())

  test('Fetch User Surveys Info - DB Size', () => SurveyIntegrationTest.fetchUserSurveysInfoDbSizeTest())

  // ==== CATEGORY

  test('Create Category', () => CategoryTest.createCategoryTest())

  test('Create Category Level', () => CategoryTest.createCategoryLevelTest())

  test('Create Category Item', () => CategoryTest.createCategoryItemTest())

  test('Update Category', () => CategoryTest.updateCategoryTest())

  test('Update Category Item Extra Def', () => CategoryTest.updateCategoryItemExtraDefTest())
  test('Delete Category Item Extra Def', () => CategoryTest.deleteCategoryItemExtraDefTest())

  test('Convert Category To GeoPackage', () => CategoryTest.convertCategoryToGeoPackageTest())
  test('Convert Category To GeoPackage (fixes wrong-type location extra def)', () =>
    CategoryTest.convertCategoryToGeoPackageFixesWrongTypeLocationExtraDefTest())
  test('Convert Category To Sampling Point Data', () => CategoryTest.convertCategoryToSamplingPointDataTest())
  test('Convert Category To Sampling Point Data (already converted)', () =>
    CategoryTest.convertCategoryToSamplingPointDataAlreadyConvertedTest())
  test('Convert Category To Sampling Point Data (duplicate)', () =>
    CategoryTest.convertCategoryToSamplingPointDataDuplicateTest())

  test('Export Category To GeoPackage', () => CategoryGeoPackageExportTest.categoryGeoPackageExportTest())
  test('Export Category To GeoPackage (hierarchical: leaf items only)', () =>
    CategoryGeoPackageExportTest.categoryGeoPackageExportHierarchicalTest())

  // ==== NODE DEF

  test('Create Node Defs', () => NodeDefTest.createNodeDefsTest())

  test('Create Node Defs Expressions Fixture', () => NodeDefTest.createExpressionsFixtureTest())

  test('Update Node Def', () => NodeDefTest.updateNodeDefTest())
})
