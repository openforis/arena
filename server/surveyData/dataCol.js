const R = require('ramda')

const NodeDef = require('../../common/survey/nodeDef')
const Node = require('../../common/record/node')
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

const getValueProcessorFn = (nodeDef, colName) => {
  const nodeDefName = NodeDef.getNodeDefName(nodeDef)
  const fns = {
    [nodeDefType.code]: (node) => colName === nodeDefName + '_' + 'code'
      //TODO
      ? Node.getNodeValue(node).itemUuid
      //'label'
      : Node.getNodeValue(node).itemUuid + '_ label'
    ,
  }

  const defaultFn = (node) => Node.getNodeValue(node, null)

  const fn = fns[NodeDef.getNodeDefType(nodeDef)]
  return fn ? fn : defaultFn
}

const getValues = (survey, nodeDefCol, record, nodeRow, nodeCol = {}) => {
  const _getValues = () => R.pipe(
    getNames,
    R.map(R.pipe(
      colName => getValueProcessorFn(nodeDefCol, colName),
      fn => fn(nodeCol),
    ))
  )(nodeDefCol)

  // entity column
  return NodeDef.isNodeDefEntity(nodeDefCol)
    ? [R.propOr(null, 'uuid', nodeCol)]
    // attribute column in multiple attribute table (value of its own table)
    : Node.getNodeDefUuid(nodeRow) === nodeDefCol.uuid
      ? [nodeRow.value]
      : _getValues()
}

module.exports = {
  getNames,
  getNamesAndType,
  getValues,
}