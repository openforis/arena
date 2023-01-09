import * as R from 'ramda'
import * as toSnakeCase from 'to-snake-case'

import * as NodeDef from '@core/survey/nodeDef'

const viewSuffix = '_view'
const tablePrefix = 'data_'

const composeTableName = (nodeDefName) => `${tablePrefix}${nodeDefName}`

export const getTableName = (nodeDef, nodeDefParent) => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefParentName = NodeDef.getName(nodeDefParent)

  return NodeDef.isEntity(nodeDef) || NodeDef.isMultiple(nodeDef)
    ? composeTableName(nodeDefName)
    : composeTableName(nodeDefParentName)
}

export const getViewName = (nodeDef, nodeDefParent) => getTableName(nodeDef, nodeDefParent) + viewSuffix

const colsByType = {
  [NodeDef.nodeDefType.code]: ['', '_label'],
  [NodeDef.nodeDefType.coordinate]: ['', '_x', '_y', '_srs'],
  [NodeDef.nodeDefType.taxon]: ['', '_scientific_name'], // ?, 'vernacular_names?'],
  [NodeDef.nodeDefType.file]: ['_file_uuid', '_file_name'],
}

const getCols = (nodeDef) => R.propOr([], NodeDef.getType(nodeDef), colsByType)

const getDefaultColumnName = (nodeDef) =>
  NodeDef.isEntity(nodeDef) ? `${NodeDef.getName(nodeDef)}_uuid` : `${NodeDef.getName(nodeDef)}`

export const getColumnNames = (nodeDef, includeExtendedCols = true) => {
  const cols = includeExtendedCols ? getCols(nodeDef) : []
  return R.isEmpty(cols) ? [getDefaultColumnName(nodeDef)] : cols.map((col) => `${NodeDef.getName(nodeDef)}${col}`)
}

export const getColumnName = R.pipe(getColumnNames, R.head)

export const getNodeDefsWithColumnNames = ({ nodeDefs, includeExtendedCols }) =>
  nodeDefs.flatMap((nodeDef) => {
    const columnNames = getColumnNames(nodeDef, includeExtendedCols)
    return columnNames.map((colName) => ({ columnName: colName, nodeDef }))
  })

export const getNodeDefsColumnNames = ({ nodeDefs, includeExtendedCols }) =>
  getNodeDefsWithColumnNames({ nodeDefs, includeExtendedCols }).flatMap(({ columnName }) => columnName)

export const getNodeDefsByColumnNames = ({ nodeDefs, includeExtendedCols }) =>
  getNodeDefsWithColumnNames({ nodeDefs, includeExtendedCols }).reduce(
    (_nodeDefs, { columnName, nodeDef }) => ({ ..._nodeDefs, [columnName]: nodeDef }),
    {}
  )

export const extractColumnName = (nodeDef, col) =>
  R.replace(
    // TODO check if toSnakeCase is necessary : if col names are snaked when creating tables
    `${toSnakeCase(NodeDef.getName(nodeDef))}_`,
    '',
    col
  )

export const extractNodeDefNameFromViewName = R.pipe(
  R.defaultTo(''),
  R.split(tablePrefix),
  R.last,
  R.split(viewSuffix),
  R.head
)
