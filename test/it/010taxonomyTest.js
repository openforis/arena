import * as TaxonomyTests from './taxonomyTest/taxonomyTests'
import * as TaxonomyPublishedTests from './taxonomyTest/taxonomyPublishedTests'

describe('Taxonomy test', () => {
  it('Taxonomy insert test', TaxonomyTests.taxonomyTests)
  it('Taxonomy update test', TaxonomyTests.taxonomyUpdateTest)
  it('Taxa insert test', TaxonomyTests.taxaInsertTest)
  it('Taxon update test', TaxonomyTests.taxonUpdateTest)
  it('Taxon published update test', TaxonomyPublishedTests.taxonPublishedUpdateTest)
  it('Taxon published updated vernacular name test', TaxonomyPublishedTests.taxonPublishedUpdateVernacularNamesTest)
})

