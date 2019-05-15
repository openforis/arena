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

const getCategoryItemUuid = (survey, nodeDef, record, parentNode, code) => surveyIndex => {

  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const parentCategoryItemUuid = levelIndex > 0 ?
    R.pipe(
      Record.getParentCodeAttribute(survey, parentNode, nodeDef),
      Node.getCategoryItemUuid
    )(record)
    : 'null'

  return R.path(
    [keys.categoryIndex, categoryUuid, parentCategoryItemUuid, code],
    surveyIndex
  )
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

  getCategoryItemUuid,

  getTaxonUuid,
  getTaxonVernacularNameUuid
}