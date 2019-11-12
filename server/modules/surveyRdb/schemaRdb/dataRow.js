import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as DataCol from './dataCol'

const getNodeCol = (nodeDefCol, nodeRow) => {

  const nodeDefUuidCol = NodeDef.getUuid(nodeDefCol)
  const nodeDefUuidRow = nodeRow['node_def_uuid']

  // attribute column in multiple attribute table (value of its own table)
  const nodeCol = nodeDefUuidRow === nodeDefUuidCol ?
    nodeRow :
    R.pathOr({}, ['children', nodeDefUuidCol], nodeRow)

  return nodeCol
}

export const getValues = (survey, nodeDefRow, nodeRow, nodeDefColumns) => {
  const values = nodeDefColumns.map(nodeDefCol => {
    const nodeCol = getNodeCol(nodeDefCol, nodeRow)

    const nodeColValues = DataCol.getValues(survey, nodeDefCol, nodeCol)

    return nodeColValues
  })

  return R.flatten(values)
}
