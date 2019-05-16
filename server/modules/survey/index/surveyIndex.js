const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

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
 * taxonomyUuidIndex : {
 *   [$taxonomyUuid] : {
 *     [$taxonCode] : {
 *       taxonUuid : $taxonUuid,
 *       vernacularNames: {
 *        [$vernacularName] : $vernacularNameUuid,
 *       ...
 *       }
 *     }
 *   }
 * }
 *
 */

const keys = {
  categoryItemUuidIndex: 'categoryItemUuidIndex',
  categoryItemIndex: 'categoryItemIndex',
  taxonomyUuidIndex: 'taxonomyUuidIndex'
}

const keysTaxonomyIndex = {
  taxonUuid: 'taxonUuid',
  vernacularNames: 'vernacularNames',
}

// ==== category index
const getCategoryItemUuidAndCodeHierarchy = (survey, nodeDef, record, parentNode, code) => surveyIndex => {
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  let parentCategoryItemUuid = 'null'
  let hierarchyCode = []

  if (levelIndex > 0) {
    const parentCodeAttribute = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
    parentCategoryItemUuid = Node.getCategoryItemUuid(parentCodeAttribute)
    hierarchyCode = R.append(Node.getCategoryItemUuid(parentCodeAttribute), Node.getHierarchyCode(parentCodeAttribute))
  }

  const itemUuid = R.path(
    [keys.categoryItemUuidIndex, categoryUuid, parentCategoryItemUuid, code],
    surveyIndex
  )
  return {
    itemUuid,
    hierarchyCode
  }
}

const getCategoryItemByUuid = categoryItemUuid => R.pathOr(null, [keys.categoryItemIndex, categoryItemUuid])

// ==== taxonomy index

const getTaxonUuid = (nodeDef, taxonCode) => surveyIndex => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path(
    [keys.taxonomyUuidIndex, taxonomyUuid, taxonCode, keysTaxonomyIndex.taxonUuid],
    surveyIndex
  )
}

const getTaxonVernacularNameUuid = (nodeDef, taxonCode, vernacularName) => surveyIndex => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path(
    [keys.taxonomyUuidIndex, taxonomyUuid, taxonCode, keysTaxonomyIndex.vernacularNames, vernacularName],
    surveyIndex
  )
}

module.exports = {
  keys,

  // ==== category index
  getCategoryItemUuidAndCodeHierarchy,
  getCategoryItemByUuid,

  // ==== taxonomy index
  getTaxonUuid,
  getTaxonVernacularNameUuid
}