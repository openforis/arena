const R = require('ramda')

const NodeDef = require('../../../common/survey/nodeDef')
const ColProps = require('./dataColProps')

const getDefaultColumnName = nodeDef => NodeDef.isNodeDefEntity(nodeDef)
  ? `${NodeDef.getNodeDefName(nodeDef)}_uuid`
  : `${NodeDef.getNodeDefName(nodeDef)}`

const getNames = nodeDef => {
  const cols = ColProps.getCols(nodeDef)
  return R.isEmpty(cols)
    ? [getDefaultColumnName(nodeDef)]
    : cols.map(
      col => NodeDef.getNodeDefName(nodeDef) + '_' + col
    )
}

const getNamesAndType = nodeDefCol =>
  getNames(nodeDefCol).map(col =>
    `${col} ${ColProps.getColTypeProcessor(nodeDefCol)(col)}`
  )

const getValues = async (surveyInfo, nodeDefCol, nodeCol = {}) => {
  const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
  const valueFn = await valueFnProcessor(surveyInfo, nodeDefCol, nodeCol)
  const values = getNames(nodeDefCol).map(colName =>
    valueFn(nodeCol, colName)
  )
  return values
}

module.exports = {
  getNames,
  getNamesAndType,
  getValues,
}