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
export const colNameUuuid = 'uuid'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const colNameParentUuuid = 'parent_uuid'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const colNameRecordUuuid = 'record_uuid'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const colNameRecordCycle = 'record_cycle'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const colNameDateCreated = 'date_created'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const colNameDateModified = 'date_modified'

// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef
 */
export const getNodeDefColumns = (survey, nodeDef) =>
  NodeDef.isEntity(nodeDef)
    ? R.pipe(
        Survey.getNodeDefChildren(nodeDef, NodeDef.isAnalysis(nodeDef)),
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
  colNameUuuid,
  colNameRecordUuuid,
  colNameRecordCycle,
  colNameParentUuuid,
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNames)),
]

// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const getRowValues = (survey, nodeDefRow, nodeRow, nodeDefColumns) => {
  const rowValues = DataRow.getValues(survey, nodeDefRow, nodeRow, nodeDefColumns)

  return [
    Node.getUuid(nodeRow),
    nodeRow[colNameRecordUuuid],
    nodeRow[colNameRecordCycle],
    nodeRow[colNameParentUuuid],
    ...rowValues,
  ]
}
