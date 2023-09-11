import * as R from 'ramda'
import * as toSnakeCase from 'to-snake-case'

import * as NodeDef from '@core/survey/nodeDef'
import { ColumnNodeDef } from '@common/model/db'

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

const getDefaultColumnName = (nodeDef) =>
  NodeDef.isEntity(nodeDef) ? `${NodeDef.getName(nodeDef)}_uuid` : `${NodeDef.getName(nodeDef)}`

export const getColumnNames = (nodeDef, includeExtendedCols = true) =>
  includeExtendedCols ? ColumnNodeDef.getColumnNames(nodeDef) : [getDefaultColumnName(nodeDef)]

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
