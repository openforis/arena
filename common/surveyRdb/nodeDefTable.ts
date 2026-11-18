import type { NodeDef as ArenaNodeDef, NodeDefType, NodeDefEntity } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import ColumnNodeDef from '@common/model/db/tables/dataNodeDef/columnNodeDef'

type AnyNodeDef = ArenaNodeDef<NodeDefType>
type NodeDefsColumnsParams = { nodeDefs: AnyNodeDef[]; includeExtendedCols?: boolean }

const viewSuffix = '_view'
const tablePrefix = 'data_'

const composeTableName = (nodeDefName: string): string => `${tablePrefix}${nodeDefName}`

export const getTableName = (nodeDef: AnyNodeDef, nodeDefParent?: NodeDefEntity | null): string => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefParentName = NodeDef.getName(nodeDefParent)

  return NodeDef.isEntity(nodeDef) || NodeDef.isMultiple(nodeDef)
    ? composeTableName(nodeDefName)
    : composeTableName(nodeDefParentName)
}

export const getViewName = (nodeDef: AnyNodeDef, nodeDefParent?: NodeDefEntity | null): string =>
  getTableName(nodeDef, nodeDefParent) + viewSuffix

const getDefaultColumnName = (nodeDef: AnyNodeDef): string =>
  NodeDef.isEntity(nodeDef) ? `${NodeDef.getName(nodeDef)}_uuid` : `${NodeDef.getName(nodeDef)}`

export const getColumnNames = (nodeDef: AnyNodeDef, includeExtendedCols = true): string[] =>
  includeExtendedCols ? ColumnNodeDef.getColumnNames(nodeDef) : [getDefaultColumnName(nodeDef)]

export const getColumnName = (nodeDef: AnyNodeDef, includeExtendedCols = true): string =>
  getColumnNames(nodeDef, includeExtendedCols)[0]

export const getNodeDefsWithColumnNames = ({
  nodeDefs,
  includeExtendedCols,
}: NodeDefsColumnsParams): { columnName: string; nodeDef: AnyNodeDef }[] =>
  nodeDefs.flatMap((nodeDef) => {
    const columnNames = getColumnNames(nodeDef, includeExtendedCols)
    return columnNames.map((colName) => ({ columnName: colName, nodeDef }))
  })

export const getNodeDefsColumnNames = ({ nodeDefs, includeExtendedCols }: NodeDefsColumnsParams): string[] =>
  getNodeDefsWithColumnNames({ nodeDefs, includeExtendedCols }).map(({ columnName }) => columnName)

export const getNodeDefsByColumnNames = ({
  nodeDefs,
  includeExtendedCols,
}: NodeDefsColumnsParams): Record<string, AnyNodeDef> => {
  const nodeDefsByColumnName: Record<string, AnyNodeDef> = {}
  for (const { columnName, nodeDef } of getNodeDefsWithColumnNames({ nodeDefs, includeExtendedCols })) {
    nodeDefsByColumnName[columnName] = nodeDef
  }
  return nodeDefsByColumnName
}

export const extractNodeDefNameFromViewName: (viewName: string | null | undefined) => string = A.pipe(
  A.defaultTo(''),
  A.split(tablePrefix),
  A.last,
  A.split(viewSuffix),
  A.head
)
