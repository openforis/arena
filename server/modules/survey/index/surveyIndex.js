const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

/**
 * categoryIndex : {
 *    [$categoryUuid] : {
 *      [$parentCategoryItemUuid] :{
 *        [$categoryItemCode] : $categoryItemUuid
 *      }
 *    }
 * }
 *
 * taxonomyIndex : {
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
  categoryIndex: 'categoryIndex',
  taxonomyIndex: 'taxonomyIndex'
}

const keysTaxonomyIndex = {
  taxonUuid: 'taxonUuid',
  vernacularNames: 'vernacularNames',
}

const getCategoryItemUuidAndCodeHierarchy = (survey, nodeDef, record, parentNode, code) => surveyIndex => {

  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)

  let parentCategoryItemUuid, hierarchyCode

  if (levelIndex > 0) {
    const parentCodeAttribute = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
    parentCategoryItemUuid = Node.getCategoryItemUuid(parentCodeAttribute)
    hierarchyCode = R.append(Node.getCategoryItemUuid(parentCodeAttribute), Node.getHierarchyCode(parentCodeAttribute))
  } else {
    parentCategoryItemUuid = 'null'
    hierarchyCode = []
  }
  const itemUuid = R.path(
    [keys.categoryIndex, categoryUuid, parentCategoryItemUuid, code],
    surveyIndex
  )
  return {
    itemUuid,
    hierarchyCode
  }
}

const getTaxonUuid = (nodeDef, taxonCode) => surveyIndex => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path([
    keys.taxonomyIndex,
    taxonomyUuid,
    taxonCode,
    keysTaxonomyIndex.taxonUuid
  ])(surveyIndex)
}

const getTaxonVernacularNameUuid = (nodeDef, taxonCode, vernacularName) => surveyIndex => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return R.path([
    keys.taxonomyIndex,
    taxonomyUuid,
    taxonCode,
    keysTaxonomyIndex.vernacularNames,
    vernacularName
  ])(surveyIndex)
}

module.exports = {
  keys,

  getCategoryItemUuidAndCodeHierarchy,

  getTaxonUuid,
  getTaxonVernacularNameUuid
}