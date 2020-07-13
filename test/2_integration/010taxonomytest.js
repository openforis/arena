import * as TaxonomyTests from './taxonomyTest/taxonomyTests'
import * as TaxonomyPublishedTests from './taxonomyTest/taxonomyPublishedTests'

export const TaxonomyTest = async () => {
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
}
