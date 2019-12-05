import * as R from 'ramda'
import * as toSnakeCase from 'to-snake-case'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

const viewSuffix = '_view'
const tablePrefix = 'data_'
const parentTablePrefix = '_$parent$_'

const composeTableName = (nodeDefName, nodeDefParentName = '') => `${tablePrefix}${nodeDefParentName}${nodeDefName}`

export const getTableName = (nodeDef, nodeDefParent) => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefParentName = NodeDef.getName(nodeDefParent)

  return NodeDef.isEntity(nodeDef)
    ? composeTableName(nodeDefName)
    : NodeDef.isMultiple(nodeDef)
    ? composeTableName(nodeDefName, nodeDefParentName + parentTablePrefix)
    : composeTableName(nodeDefParentName)
}

export const getViewName = (nodeDef, nodeDefParent) => getTableName(nodeDef, nodeDefParent) + viewSuffix

const cols = {
  [NodeDef.nodeDefType.code]: ['code', 'label'],
  [NodeDef.nodeDefType.taxon]: ['code', 'scientific_name'], // ?, 'vernacular_names?'],
  [NodeDef.nodeDefType.file]: ['file_uuid', 'file_name'],
}

const getCols = nodeDef => R.propOr([], NodeDef.getType(nodeDef), cols)

const getDefaultColumnName = nodeDef =>
  NodeDef.isEntity(nodeDef) ? `${NodeDef.getName(nodeDef)}_uuid` : `${NodeDef.getName(nodeDef)}`

export const getColNames = nodeDef => {
  const cols = getCols(nodeDef)
  return R.isEmpty(cols) ? [getDefaultColumnName(nodeDef)] : cols.map(col => NodeDef.getName(nodeDef) + '_' + col)
}

export const getColName = R.pipe(getColNames, R.head)

export const getColNamesByUuids = nodeDefUuidCols => survey =>
  R.reduce(
    (cols, uuid) => R.pipe(Survey.getNodeDefByUuid(uuid), getColNames, R.concat(cols))(survey),
    [],
    nodeDefUuidCols,
  )

export const extractColName = (nodeDef, col) =>
  R.replace(
    // TODO check if toSnakeCase is necessary : if col names are snaked when creating tables
    toSnakeCase(NodeDef.getName(nodeDef)) + '_',
    '',
    col,
  )

export const extractNodeDefNameFromViewName = R.pipe(
  R.defaultTo(''),
  R.split(tablePrefix),
  R.last,
  R.split(viewSuffix),
  R.head,
  R.split(parentTablePrefix),
  R.last,
)
