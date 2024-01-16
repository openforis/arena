import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as DataCol from './dataCol'

const getNodeCol = (nodeDefCol, nodeRow) => {
  const nodeDefUuidCol = NodeDef.getUuid(nodeDefCol)
  const nodeDefUuidRow = Node.getNodeDefUuid(nodeRow)
  // Attribute column in multiple attribute table (value of its own table)
  const nodeCol = nodeDefUuidRow === nodeDefUuidCol ? nodeRow : R.pathOr({}, ['children', nodeDefUuidCol], nodeRow)

  return nodeCol
}

export const getValues = ({ survey, nodeRow, nodeDefColumns }) => {
  const values = nodeDefColumns.map((nodeDefCol) => {
    const nodeCol = getNodeCol(nodeDefCol, nodeRow)
    const nodeColValues = DataCol.getValues(survey, nodeDefCol, nodeCol)
    return nodeColValues
  })

  return R.flatten(values)
}
