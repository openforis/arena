const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

/**
 * categoryIndex : {
 *    [categoryUuid] : {
 *      [parentCategoryItemUuid] :{
 *        [categoryItemCode] : categoryItemUuid
 *      }
 *    }
 * }
 *
 */

const keys = {
  categoryIndex: 'categoryIndex',
  taxonomyIndex: 'taxonomyIndex'
}

const getCategoryItemUuid = (survey, nodeDef, record, node, code) => surveyIndex => {

  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const parentCategoryItemUuid = levelIndex > 0 ?
    R.pipe(
      Record.getParentCodeAttribute(
        survey,
        Record.getParentNode(node)(record),
        nodeDef
      ),
      Node.getCategoryItemUuid
    )(record)
    : 'null'

  return R.path(
    [keys.categoryIndex, categoryUuid, parentCategoryItemUuid, code],
    surveyIndex
  )
}

module.exports = {
  keys,

  getCategoryItemUuid,
}