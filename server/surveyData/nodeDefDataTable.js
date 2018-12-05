const R = require('ramda')

const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')
const {nodeDefType} = NodeDef

const nodeDefColumnFields = {
  [nodeDefType.code]: ['code', 'label'],
  [nodeDefType.coordinate]: ['x', 'y', 'srs'],
  [nodeDefType.taxon]: ['code', 'scientific_name', 'vernacular_name'],
}

const getValueProcessor = (nodeDef, col) => {
  const nodeDefName = NodeDef.getNodeDefName(nodeDef)
  const fns = {
    [nodeDefType.code]: (node) => col === nodeDefName + '_' + 'code'
      ? Node.getNodeValue(node).itemUuid
      //'label'
      : Node.getNodeValue(node).itemUuid + '_ label'
    ,
  }

  const defaultFn = (node) => Node.getNodeValue(node, null)

  const fn = fns[NodeDef.getNodeDefType(nodeDef)]
  return fn ? fn : defaultFn

}

const getDefaultColumnName = nodeDef => NodeDef.isNodeDefEntity(nodeDef)
  ? `${NodeDef.getNodeDefName(nodeDef)}_uuid`
  : `${NodeDef.getNodeDefName(nodeDef)}`

const getColumnNames = nodeDef => R.pipe(
  NodeDef.getNodeDefType,
  type => nodeDefColumnFields[type]
    ? nodeDefColumnFields[type].map(
      col => NodeDef.getNodeDefName(nodeDef) + '_' + col
    )
    : [getDefaultColumnName(nodeDef)]
)(nodeDef)

const getTableName = (survey, nodeDef) => {
  const prefix = NodeDef.isNodeDefEntity(nodeDef)
    ? nodeDef.id
    : `${Survey.getNodeDefParent(nodeDef)(survey).id}_${nodeDef.id}`

  return `_${prefix}_data`
}

const getColumnsWithType = nodeDef => R.pipe(
  getColumnNames,
  R.map(col => NodeDef.isNodeDefEntity(nodeDef)
    ? `${col} uuid`
    : `${col} VARCHAR`
  ),
)(nodeDef)

const getColumnValues = (survey, nodeDef, record, nodeRow) => {
  const columnNodes = NodeDef.isNodeDefRoot(nodeDef)
    ? [Record.getRootNode(record)]
    : Record.getNodeChildrenByDefUuid(nodeRow, nodeDef.uuid)(record)

  const getValues = () => R.pipe(
    getColumnNames,
    R.map(R.pipe(
      col => getValueProcessor(nodeDef, col),
      fn => fn(columnNodes[0]),
    ))
  )(nodeDef)

  if (NodeDef.isNodeDefEntity(nodeDef)) {
    // entity column
    return columnNodes && !R.isEmpty(columnNodes)
      ? [columnNodes[0].uuid]
      : getColumnValues(survey, nodeDef, record, Record.getParentNode(nodeRow)(record))

  } else {

    return Node.getNodeDefUuid(nodeRow) === nodeDef.uuid
      // attribute column in multiple attribute table (value of its own table)
      ? [nodeRow.value]
      : R.isEmpty(columnNodes) ? [null] : getValues()

  }
}
// === data row
const getNodeDefColumns = (survey, nodeDef) => {
  if (NodeDef.isNodeDefEntity(nodeDef)) {

    return R.pipe(
      Survey.getNodeDefChildren(nodeDef),
      R.reject(NodeDef.isNodeDefMultiple),
      R.reject(NodeDef.isNodeDefEntity),
      R.concat(Survey.getAncestorsHierarchy(nodeDef)(survey)),
      R.reject(R.isEmpty),
      R.sortBy(R.ascend(R.prop('id')))
    )(survey)

  } else {

    const parent = Survey.getNodeDefParent(nodeDef)(survey)
    return R.pipe(
      R.append(parent),
      R.append(nodeDef),
      R.concat(Survey.getAncestorsHierarchy(parent)(survey)),
      R.reject(R.isEmpty),
      R.sortBy(R.ascend(R.prop('id')))
    )([])

  }
}

module.exports = {
  getTableName,
  getNodeDefColumns,
  getColumnsWithType,
  getColumnNames,
  getColumnValues,
}