import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as DataCol from './dataCol'

const getNodeCol = (nodeDefCol, nodeRow) => {
  const nodeDefUuidCol = NodeDef.getUuid(nodeDefCol)
  const nodeDefUuidRow = nodeRow.node_def_uuid

  // Attribute column in multiple attribute table (value of its own table)
  return nodeDefUuidRow === nodeDefUuidCol ? nodeRow : R.pathOr({}, ['children', nodeDefUuidCol], nodeRow)
}

export const getValuesByColumnName = ({ survey, nodeRow, nodeDefColumns }) =>
  nodeDefColumns.reduce((acc, nodeDefCol) => {
    const nodeCol = getNodeCol(nodeDefCol, nodeRow)
    const valuesByColumnName = DataCol.getValuesByColumnName({ survey, nodeDefCol, nodeCol })
    Object.assign(acc, valuesByColumnName)
    return acc
  }, {})
