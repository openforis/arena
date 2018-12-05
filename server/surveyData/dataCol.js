const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../common/survey/survey')
const SurveyUtils = require('../../common/survey/surveyUtils')
const NodeDef = require('../../common/survey/nodeDef')
const Node = require('../../common/record/node')
const CategoryManager = require('../category/categoryManager')

const {nodeDefType} = NodeDef

const nodeDefColumnFields = {
  [nodeDefType.code]: ['code', 'label'],
  [nodeDefType.coordinate]: ['x', 'y', 'srs'],
  [nodeDefType.taxon]: ['code', 'scientific_name', 'vernacular_name'],
}

const getDefaultColumnName = nodeDef => NodeDef.isNodeDefEntity(nodeDef)
  ? `${NodeDef.getNodeDefName(nodeDef)}_uuid`
  : `${NodeDef.getNodeDefName(nodeDef)}`

const getNames = nodeDef => R.pipe(
  NodeDef.getNodeDefType,
  type => nodeDefColumnFields[type]
    ? nodeDefColumnFields[type].map(
      col => NodeDef.getNodeDefName(nodeDef) + '_' + col
    )
    : [getDefaultColumnName(nodeDef)]
)(nodeDef)

const getNamesAndType = nodeDef => R.pipe(
  getNames,
  R.map(col => NodeDef.isNodeDefEntity(nodeDef)
    ? `${col} uuid`
    : `${col} VARCHAR`
  ),
)(nodeDef)

const getValueProcessorFn = (survey, nodeDef) => {
  const nodeDefName = NodeDef.getNodeDefName(nodeDef)
  const fns = {
    [nodeDefType.code]: async (node, colName) => {
      const surveyInfo = Survey.getSurveyInfo(survey)
      const item = await CategoryManager.fetchItemByUuid(surveyInfo.id, Node.getNodeValue(node).itemUuid)

      return colName === nodeDefName + '_' + 'code'
        ? SurveyUtils.getProp('code')(item)
        //'label'
        : SurveyUtils.getLabel(Survey.getDefaultLanguage(surveyInfo))(item)
    }
  }

  const defaultFn = (node) => Node.getNodeValue(node, null)

  const fn = fns[NodeDef.getNodeDefType(nodeDef)]
  return fn ? fn : defaultFn
}

const getValues = async (survey, nodeDefCol, record, nodeRow, nodeCol = {}) => {
  const _getValues = async () => {
    const valueFn = getValueProcessorFn(survey, nodeDefCol)
    const names = getNames(nodeDefCol)
    return await Promise.all(
      names.map(async colName =>
        await valueFn(nodeCol, colName)
      )
    )
  }

  // entity column
  return NodeDef.isNodeDefEntity(nodeDefCol)
    ? [R.propOr(null, 'uuid', nodeCol)]
    // attribute column in multiple attribute table (value of its own table)
    : Node.getNodeDefUuid(nodeRow) === nodeDefCol.uuid
      ? [nodeRow.value]
      : await _getValues()
}

module.exports = {
  getNames,
  getNamesAndType,
  getValues,
}