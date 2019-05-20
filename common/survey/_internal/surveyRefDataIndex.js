const R = require('ramda')

const ObjectUtils = require('../../../common/objectUtils')

const SurveyNodeDefs = require('./surveyNodeDefs')
const NodeDef = require('../../../common/survey/nodeDef')
const RecordReader = require('../../../common/record/_internal/recordReader')
const Node = require('../../../common/record/node')

const CategoryItem = require('../../../common/survey/categoryItem')
const CategoryLevel = require('../../../common/survey/categoryLevel')
const Taxon = require('../../../common/survey/taxon')

/**
 * categoryItemUuidIndex : {
 *    [$categoryUuid] : {
 *      [$parentCategoryItemUuid] :{
 *        [$categoryItemCode] : $categoryItemUuid
 *      }
 *    }
 * }
 *
 * categoryItemIndex : {
 *    [$categoryItemUuid] : { ...$categoryItem }
 * }
 *
 * taxonUuidIndex : {
 *   [$taxonomyUuid] : {
 *     [$taxonCode] : {
 *       uuid : $taxonUuid,
 *       vernacularNames: {
 *        [$vernacularName] : $vernacularNameUuid,
 *       ...
 *       }
 *     }
 *   }
 * }
 *
 *  taxonIndex : {
 *    [$taxonUuid] : { ...$taxon }
 * }
 *
 */

const keys = {
  // root path key
  indexRefData: '_indexRefData',
  // ref data indexes
  categoryItemUuidIndex: 'categoryItemUuidIndex',
  categoryItemIndex: 'categoryItemIndex',
  taxonUuidIndex: 'taxonUuidIndex',
  taxonIndex: 'taxonIndex'
}

// ====== READ

// ==== category index
const getCategoryItemUuidAndCodeHierarchy = (survey, nodeDef, record, parentNode, code) => surveyIndex => {
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const levelIndex = SurveyNodeDefs.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  let parentCategoryItemUuid = 'null'
  let hierarchyCode = []

  if (levelIndex > 0) {
    const parentCodeAttribute = RecordReader.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
    parentCategoryItemUuid = Node.getCategoryItemUuid(parentCodeAttribute)
    hierarchyCode = R.append(Node.getCategoryItemUuid(parentCodeAttribute), Node.getHierarchyCode(parentCodeAttribute))
  }

  const itemUuid = R.path(
    [keys.indexRefData, keys.categoryItemUuidIndex, categoryUuid, parentCategoryItemUuid, code],
    surveyIndex
  )
  return {
    itemUuid,
    hierarchyCode
  }
}

const getCategoryItemByUuid = categoryItemUuid => R.pathOr(null, [keys.indexRefData, keys.categoryItemIndex, categoryItemUuid])

// ==== taxonomy index

const getTaxonUuid = (nodeDef, taxonCode) => surveyIndex => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path(
    [keys.indexRefData, keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.keys.uuid],
    surveyIndex
  )
}

const getTaxonVernacularNameUuid = (nodeDef, taxonCode, vernacularName) => surveyIndex => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path(
    [keys.indexRefData, keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.propKeys.vernacularNames, vernacularName],
    surveyIndex
  )
}

const getTaxonByUuid = taxonUuid => R.path([keys.indexRefData, keys.taxonIndex, taxonUuid])

// ====== UPDATE

const assocRefData = (categoryItemsRefData, taxaIndexRefData) => survey => {
  const refDataIndex = {
    // category indexes
    [keys.categoryItemUuidIndex]: _getCategoryItemUuidIndex(categoryItemsRefData),
    [keys.categoryItemIndex]: ObjectUtils.toUuidIndexedObj(categoryItemsRefData),
    // taxonomy indexes
    [keys.taxonUuidIndex]: _getTaxonomyUuidIndex(taxaIndexRefData),
    [keys.taxonIndex]: ObjectUtils.toUuidIndexedObj(taxaIndexRefData)
  }

  return {
    ...survey,
    [keys.indexRefData]: refDataIndex
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
  // ==== category index
  getCategoryItemUuidAndCodeHierarchy,
  getCategoryItemByUuid,

  // ==== taxonomy index
  getTaxonUuid,
  getTaxonVernacularNameUuid,
  getTaxonByUuid,

  assocRefData,
}