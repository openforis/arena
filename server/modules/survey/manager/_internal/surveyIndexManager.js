const R = require('ramda')
const Promise = require('bluebird')

const db = require('../../../../db/db')
const ObjectUtils = require('../../../../../common/objectUtils')

const CategoryRepository = require('../../../category/repository/categoryRepository')
const TaxonomyRepository = require('../../../taxonomy/repository/taxonomyRepository')

const SurveyIndex = require('../../index/surveyIndex')

const CategoryItem = require('../../../../../common/survey/categoryItem')
const CategoryLevel = require('../../../../../common/survey/categoryLevel')

const fetchIndex = async (surveyId, client = db) => {
  const [categoryIndexRS, taxonomyIndexRS] = await Promise.all([
    CategoryRepository.fetchIndex(surveyId, client),
    TaxonomyRepository.fetchIndex(surveyId, client)
  ])

  return {
    // category indexes
    [SurveyIndex.keys.categoryItemUuidIndex]: _getCategoryItemUuidIndex(categoryIndexRS),
    [SurveyIndex.keys.categoryItemIndex]: ObjectUtils.toUuidIndexedObj(categoryIndexRS),
    // taxonomy indexes
    [SurveyIndex.keys.taxonomyUuidIndex]: _getTaxonomyUuidIndex(taxonomyIndexRS)
  }
}

const _getCategoryItemUuidIndex = R.reduce(
  (accIndex, row) => ObjectUtils.setInPath(
    [
      CategoryLevel.getCategoryUuid(row),
      CategoryItem.getParentUuid(row) || 'null',
      CategoryItem.getCode(row)
    ],
    CategoryItem.getUuid(row)
  )(accIndex),
  {}
)

const _getTaxonomyUuidIndex = (taxonomyIndexRS) =>
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
    taxonomyIndexRS
  )

module.exports = {
  fetchIndex
}