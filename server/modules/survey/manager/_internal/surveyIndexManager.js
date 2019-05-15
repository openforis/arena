const R = require('ramda')
const Promise = require('bluebird')

const db = require('../../../../db/db')
const ObjectUtils = require('../../../../../common/objectUtils')

const CategoryRepository = require('../../../category/repository/categoryRepository')
const TaxonomyRepository = require('../../../taxonomy/repository/taxonomyRepository')

const SurveyIndex = require('../../index/surveyIndex')

const fetchIndex = async (surveyId, client = db) => {
  const [categoryIndex, taxonomyIndex] = await Promise.all([
    _fetchCategoryIndex(surveyId, client),
    _fetchTaxonomyIndex(surveyId, client)
  ])

  return {
    [SurveyIndex.keys.categoryIndex]: categoryIndex,
    [SurveyIndex.keys.taxonomyIndex]: taxonomyIndex
  }
}

const _fetchCategoryIndex = async (surveyId, client = db) =>
  R.reduce(
    (accIndex, row) => ObjectUtils.setInPath(
      [
        row.category_uuid,
        JSON.stringify(row.parent_uuid),
        row.code,
      ],
      row.item_uuid
    )(accIndex),
    {},
    await CategoryRepository.fetchIndex(surveyId, client)
  )

const _fetchTaxonomyIndex = async (surveyId, client = db) =>
  R.reduce(
    (accIndex, row) => ObjectUtils.setInPath(
      [
        row.taxonomy_uuid,
        row.code
      ],
      {
        taxonUuid: row.taxon_uuid,
        vernacularNames: R.mergeAll(row.vernacular_names),
      }
    )(accIndex),
    {},
    await TaxonomyRepository.fetchIndex(surveyId, client)
  )

module.exports = {
  fetchIndex
}