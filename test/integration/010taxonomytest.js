import * as TaxonomyTests from './tests/_taxonomy/taxonomyTests'
import * as TaxonomyPublishedTests from './tests/_taxonomy/taxonomyPublishedTests'

describe('Taxonomy test', () => {
  test('Taxonomy insert test', TaxonomyTests.taxonomyTests)
  test('Taxonomy update test', TaxonomyTests.taxonomyUpdateTest)
  test('Taxa insert test', TaxonomyTests.taxaInsertTest)
  test('Taxon update test', TaxonomyTests.taxonUpdateTest)
  test('Taxonomy import test error (missing columns)', TaxonomyTests.taxonomyImportErrorMissingColumnsTest)
  test('Taxonomy import test error (duplicate items)', TaxonomyTests.taxonomyImportErrorDuplicateItemsTest)
  test('Taxonomy import new test', TaxonomyTests.taxonomyImportNewTest)
  test('Taxon published update test', TaxonomyPublishedTests.taxonPublishedUpdateTest)
  test('Taxon published add vernacular name test', TaxonomyPublishedTests.taxonPublishedAddVernacularNameTest)
  test('Taxon published update vernacular names test', TaxonomyPublishedTests.taxonPublishedUpdateVernacularNamesTest)
})
