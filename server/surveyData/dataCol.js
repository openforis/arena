const R = require('ramda')

const NodeDef = require('../../common/survey/nodeDef')
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

const getNamesAndType = nodeDef => R.pipe(
  getNames,
  R.map(col => NodeDef.isNodeDefEntity(nodeDef)
    ? `${col} uuid`
    : `${col} VARCHAR`
  ),
)(nodeDef)

const getValues = async (surveyInfo, nodeDefCol, nodeCol = {}) => {
  const _getValues = async () => {
    const valueFnProcessor = ColProps.getColValueProcessor(nodeDefCol)
    const valueFn = await valueFnProcessor(surveyInfo, nodeDefCol, nodeCol)

    return getNames(nodeDefCol).map(colName =>
      valueFn(nodeCol, colName)
    )
  }

  // entity column
  return NodeDef.isNodeDefEntity(nodeDefCol)
    ? [R.propOr(null, 'uuid', nodeCol)]
    // attribute column in multiple attribute table (value of its own table)
    : await _getValues()
}

module.exports = {
  getNames,
  getNamesAndType,
  getValues,
}