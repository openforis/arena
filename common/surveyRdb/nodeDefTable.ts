import type { ArenaNodeDefEntity, ArenaAnyNodeDef } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import ColumnNodeDef from '@common/model/db/tables/dataNodeDef/columnNodeDef'

type NodeDefsColumnsParams = { nodeDefs: ArenaAnyNodeDef[]; includeExtendedCols?: boolean }

const viewSuffix = '_view'
const tablePrefix = 'data_'

const composeTableName = (nodeDefName: string): string => `${tablePrefix}${nodeDefName}`

export const getTableName = (nodeDef: ArenaAnyNodeDef, nodeDefParent?: ArenaNodeDefEntity | null): string => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefParentName = NodeDef.getName(nodeDefParent)

  return NodeDef.isEntity(nodeDef) || NodeDef.isMultiple(nodeDef)
    ? composeTableName(nodeDefName)
    : composeTableName(nodeDefParentName)
}

export const getViewName = (nodeDef: ArenaAnyNodeDef, nodeDefParent?: ArenaNodeDefEntity | null): string =>
  getTableName(nodeDef, nodeDefParent) + viewSuffix

const getDefaultColumnName = (nodeDef: ArenaAnyNodeDef): string =>
  NodeDef.isEntity(nodeDef) ? `${NodeDef.getName(nodeDef)}_uuid` : `${NodeDef.getName(nodeDef)}`

export const getColumnNames = (nodeDef: ArenaAnyNodeDef, includeExtendedCols = true): string[] =>
  includeExtendedCols ? ColumnNodeDef.getColumnNames(nodeDef) : [getDefaultColumnName(nodeDef)]

export const getColumnName = (nodeDef: ArenaAnyNodeDef, includeExtendedCols = true): string =>
  getColumnNames(nodeDef, includeExtendedCols)[0]

export const getNodeDefsWithColumnNames = ({
  nodeDefs,
  includeExtendedCols,
}: NodeDefsColumnsParams): { columnName: string; nodeDef: ArenaAnyNodeDef }[] =>
  nodeDefs.flatMap((nodeDef) => {
    const columnNames = getColumnNames(nodeDef, includeExtendedCols)
    return columnNames.map((colName) => ({ columnName: colName, nodeDef }))
  })

export const getNodeDefsColumnNames = ({ nodeDefs, includeExtendedCols }: NodeDefsColumnsParams): string[] =>
  getNodeDefsWithColumnNames({ nodeDefs, includeExtendedCols }).map(({ columnName }) => columnName)

export const getNodeDefsByColumnNames = ({
  nodeDefs,
  includeExtendedCols,
}: NodeDefsColumnsParams): Record<string, ArenaAnyNodeDef> => {
  const nodeDefsByColumnName: Record<string, ArenaAnyNodeDef> = {}
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
