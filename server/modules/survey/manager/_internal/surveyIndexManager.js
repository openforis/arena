const R = require('ramda')
const Promise = require('bluebird')

const db = require('../../../../db/db')
const ObjectUtils = require('../../../../../common/objectUtils')

const CategoryRepository = require('../../../category/repository/categoryRepository')
const TaxonomyRepository = require('../../../taxonomy/repository/taxonomyRepository')

const SurveyIndex = require('../../index/surveyIndex')

const CategoryItem = require('../../../../../common/survey/categoryItem')
const CategoryLevel = require('../../../../../common/survey/categoryLevel')
const Taxon = require('../../../../../common/survey/taxon')

const fetchIndex = async (surveyId, draft = false, client = db) => {
  const [categoryIndexRS, taxonomyIndexRS] = await Promise.all([
    CategoryRepository.fetchIndex(surveyId, draft, client),
    TaxonomyRepository.fetchIndex(surveyId, draft, client)
  ])

  return {
    // category indexes
    [SurveyIndex.keys.categoryItemUuidIndex]: _getCategoryItemUuidIndex(categoryIndexRS),
    [SurveyIndex.keys.categoryItemIndex]: ObjectUtils.toUuidIndexedObj(categoryIndexRS),
    // taxonomy indexes
    [SurveyIndex.keys.taxonUuidIndex]: _getTaxonomyUuidIndex(taxonomyIndexRS),
    [SurveyIndex.keys.taxonIndex]: ObjectUtils.toUuidIndexedObj(taxonomyIndexRS)
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

const _getTaxonomyUuidIndex = R.reduce(
  (accIndex, row) => ObjectUtils.setInPath(
    [
      Taxon.getTaxonomyUuid(row),
      Taxon.getCode(row)
    ],
    {
      [Taxon.keys.uuid]: Taxon.getUuid(row),
      [Taxon.propKeys.vernacularNames]: R.pipe(
        R.prop(Taxon.propKeys.vernacularNames),
        R.mergeAll
      )(row),
    }
  )(accIndex),
  {}
)

module.exports = {
  fetchIndex
}