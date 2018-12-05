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

const getValueProcessorFn = async (survey, nodeDefCol, nodeCol) => {
  const nodeDefName = NodeDef.getNodeDefName(nodeDefCol)
  const fns = {
    [nodeDefType.code]: async () => {
      const surveyInfo = Survey.getSurveyInfo(survey)
      const item = await CategoryManager.fetchItemByUuid(surveyInfo.id, Node.getNodeValue(nodeCol).itemUuid)

      return (node, colName) => colName === nodeDefName + '_' + 'code'
        ? SurveyUtils.getProp('code')(item)
        //'label'
        : SurveyUtils.getLabel(Survey.getDefaultLanguage(surveyInfo))(item)
    }
  }

  const defaultFn = (node) => Node.getNodeValue(node, null)

  const fn = fns[NodeDef.getNodeDefType(nodeDefCol)]
  return fn ? await fn() : defaultFn
}

const getValues = async (survey, nodeDefCol, record, nodeRow, nodeCol = {}) => {
  const _getValues = async () => {
    const valueFn = await getValueProcessorFn(survey, nodeDefCol, nodeCol)
    return getNames(nodeDefCol).map(colName =>
      valueFn(nodeCol, colName)
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