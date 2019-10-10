const R = require('ramda')
const toSnakeCase = require('to-snake-case')

const Survey = require('../survey/survey')
const NodeDef = require('../survey/nodeDef')

const viewSuffix = '_view'
const tablePrefix = 'data_'
const parentTablePrefix = '_$parent$_'

const composeTableName = (nodeDefName, nodeDefParentName = '') => `${tablePrefix}${nodeDefParentName}${nodeDefName}`

const getTableName = (nodeDef, nodeDefParent) => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefParentName = NodeDef.getName(nodeDefParent)

  return NodeDef.isEntity(nodeDef)
    ? composeTableName(nodeDefName)
    : NodeDef.isMultiple(nodeDef)
      ? composeTableName(nodeDefName, nodeDefParentName + parentTablePrefix)
      : composeTableName(nodeDefParentName)
}

const getViewName = (nodeDef, nodeDefParent) => getTableName(nodeDef, nodeDefParent) + viewSuffix

const cols = {
  [NodeDef.nodeDefType.code]: ['code', 'label'],
  [NodeDef.nodeDefType.taxon]: ['code', 'scientific_name'], //?, 'vernacular_names?'],
  [NodeDef.nodeDefType.file]: ['file_uuid', 'file_name'],
}

const getCols = nodeDef => R.propOr(
  [],
  NodeDef.getType(nodeDef),
  cols
)

const getDefaultColumnName = nodeDef => NodeDef.isEntity(nodeDef)
  ? `${NodeDef.getName(nodeDef)}_uuid`
  : `${NodeDef.getName(nodeDef)}`

const getColNames = nodeDef => {
  const cols = getCols(nodeDef)
  return R.isEmpty(cols)
    ? [getDefaultColumnName(nodeDef)]
    : cols.map(
      col => NodeDef.getName(nodeDef) + '_' + col
    )
}

const getColName = R.pipe(
  getColNames,
  R.head
)

const getColNamesByUuids = nodeDefUuidCols =>
  survey => R.reduce(
    (cols, uuid) => R.pipe(
      Survey.getNodeDefByUuid(uuid),
      getColNames,
      R.concat(cols)
    )(survey),
    [],
    nodeDefUuidCols
  )

const extractColName = (nodeDef, col) => R.replace(
  //TODO check if toSnakeCase is necessary : if col names are snaked when creating tables
  toSnakeCase(NodeDef.getName(nodeDef)) + '_',
  '',
  col
)

const extractNodeDefNameFromViewName = R.pipe(
  R.defaultTo(''),
  R.split(tablePrefix),
  R.last,
  R.split(viewSuffix),
  R.head,
  R.split(parentTablePrefix),
  R.last
)

module.exports = {
  getTableName,
  getViewName,

  getColNames,
  getColName,
  getColNamesByUuids,

  extractColName,
  extractNodeDefNameFromViewName,
}
