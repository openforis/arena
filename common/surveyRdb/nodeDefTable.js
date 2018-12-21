const R = require('ramda')

const Survey = require('../survey/survey')
const NodeDef = require('../survey/nodeDef')

const getViewName = nodeDefUuid => R.pipe(
  Survey.getNodeDefByUuid(nodeDefUuid),
  nodeDef => 'data_' + NodeDef.getNodeDefName(nodeDef) + '_view'
)

const {nodeDefType} = NodeDef
const cols = {
  [nodeDefType.code]: ['code', 'label'],
  [nodeDefType.taxon]: ['code', 'scientific_name'], //?, 'vernacular_names?'],
  [nodeDefType.file]: ['file_uuid', 'file_name'],
}

const getCols = nodeDef => R.propOr(
  [],
  cols,
  cols[NodeDef.getNodeDefType(nodeDef)]
)

const getDefaultColumnName = nodeDef => NodeDef.isNodeDefEntity(nodeDef)
  ? `${NodeDef.getNodeDefName(nodeDef)}_uuid`
  : `${NodeDef.getNodeDefName(nodeDef)}`

const getColNames = nodeDef => {
  const cols = getCols(nodeDef)
  return R.isEmpty(cols)
    ? [getDefaultColumnName(nodeDef)]
    : cols.map(
      col => NodeDef.getNodeDefName(nodeDef) + '_' + col
    )
}

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

module.exports = {
  getViewName,

  getColNames,
  getColNamesByUuids,
}
