import type { ArenaSurvey, ArenaAnyNodeDef } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import { TableDataNodeDefColUtils } from './colUtils'

type NodeRow = Record<string, any>

const getNodeCol = (nodeDefCol: ArenaAnyNodeDef, nodeRow: NodeRow): NodeRow => {
  const nodeDefUuidCol = NodeDef.getUuid(nodeDefCol)
  const nodeDefUuidRow = nodeRow.node_def_uuid

  // Attribute column in multiple attribute table (value of its own table)
  return nodeDefUuidRow === nodeDefUuidCol ? nodeRow : A.pathOr({}, ['children', nodeDefUuidCol], nodeRow)
}

const getValuesByColumnName = ({
  survey,
  nodeRow,
  nodeDefColumns,
}: {
  survey: ArenaSurvey
  nodeRow: NodeRow
  nodeDefColumns: ArenaAnyNodeDef[]
}): Record<string, unknown> => {
  const result: Record<string, unknown> = {}
  for (const nodeDefCol of nodeDefColumns) {
    const nodeCol = getNodeCol(nodeDefCol, nodeRow)
    const valuesByColumnName = TableDataNodeDefColUtils.getValuesByColumnName({ survey, nodeDefCol, nodeCol })
    Object.assign(result, valuesByColumnName)
  }
  return result
}

export const TableDataNodeDefRowUtils = {
  getValuesByColumnName,
}
