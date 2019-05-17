const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const Taxon = require('../../../../common/survey/taxon')

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
  categoryItemUuidIndex: 'categoryItemUuidIndex',
  categoryItemIndex: 'categoryItemIndex',
  taxonUuidIndex: 'taxonUuidIndex',
  taxonIndex: 'taxonIndex'
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
    [keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.keys.uuid],
    surveyIndex
  )
}

const getTaxonVernacularNameUuid = (nodeDef, taxonCode, vernacularName) => surveyIndex => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path(
    [keys.taxonUuidIndex, taxonomyUuid, taxonCode, Taxon.propKeys.vernacularNames, vernacularName],
    surveyIndex
  )
}

const getTaxonByUuid = taxonUuid => R.path([keys.taxonIndex, taxonUuid])

module.exports = {
  keys,

  // ==== category index
  getCategoryItemUuidAndCodeHierarchy,
  getCategoryItemByUuid,

  // ==== taxonomy index
  getTaxonUuid,
  getTaxonVernacularNameUuid,
  getTaxonByUuid
}