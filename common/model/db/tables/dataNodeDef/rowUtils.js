import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import { TableDataNodeDefColUtils } from './colUtils'

const getNodeCol = (nodeDefCol, nodeRow) => {
  const nodeDefUuidCol = NodeDef.getUuid(nodeDefCol)
  const nodeDefUuidRow = nodeRow.node_def_uuid

  // Attribute column in multiple attribute table (value of its own table)
  return nodeDefUuidRow === nodeDefUuidCol ? nodeRow : R.pathOr({}, ['children', nodeDefUuidCol], nodeRow)
}

const getValuesByColumnName = ({ survey, nodeRow, nodeDefColumns }) => {
  const result = {}
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
