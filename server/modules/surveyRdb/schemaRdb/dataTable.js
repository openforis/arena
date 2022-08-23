import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as Node from '@core/record/node'
import * as DataRow from './dataRow'
import * as DataCol from './dataCol'

/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameUuuid = 'uuid'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameParentUuuid = 'parent_uuid'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameAncestorUuid = 'ancestor_uuid'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameRecordUuid = 'record_uuid'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameRecordCycle = 'record_cycle'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameRecordStep = 'record_step'
// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef
 */
export const getNodeDefColumns = (survey, nodeDef) =>
  NodeDef.isEntity(nodeDef)
    ? R.pipe(
        Survey.getNodeDefDescendantAttributesInSingleEntities(nodeDef),
        R.filter(NodeDef.isSingleAttribute),
        R.sortBy(R.ascend(R.prop('id')))
      )(survey)
    : [nodeDef] // Multiple attr table

// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef
 */
export const getName = NodeDefTable.getTableName

// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef
 */
export const getColumnNames = (survey, nodeDef) => [
  columnNameUuuid,
  columnNameParentUuuid,
  ...(NodeDef.isRoot(nodeDef) ? [columnNameRecordUuid, columnNameRecordCycle, columnNameRecordStep] : []),
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map((nodeDefCol) => DataCol.getNames(nodeDefCol))),
]

// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const getRowValues = (survey, nodeDefRow, nodeRow, nodeDefColumns) => {
  const rowValues = DataRow.getValues(survey, nodeDefRow, nodeRow, nodeDefColumns)

  return [
    Node.getUuid(nodeRow),
    nodeRow[columnNameAncestorUuid],
    ...(NodeDef.isRoot(nodeDefRow)
      ? [nodeRow[columnNameRecordUuid], nodeRow[columnNameRecordCycle], nodeRow[columnNameRecordStep]]
      : []),
    ...rowValues,
  ]
}
