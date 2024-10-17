import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as DataRow from './dataRow'
import * as DataCol from './dataCol'

/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameUuid = 'uuid'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameParentUuid = 'parent_uuid'
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
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameRecordOwnerUuid = 'record_owner_uuid'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameDateCreated = 'date_created'
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const columnNameDateModified = 'date_modified'

// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const getNodeDefColumns = ({ survey, nodeDef, includeAnalysis = false }) =>
  NodeDef.isEntity(nodeDef)
    ? R.pipe(
        Survey.getNodeDefDescendantAttributesInSingleEntities({ nodeDef, includeAnalysis }),
        R.filter(NodeDef.isSingleAttribute),
        R.sortBy(R.ascend(R.prop('id')))
      )(survey)
    : [nodeDef] // Multiple attr table

// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const getName = NodeDefTable.getTableName

// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const getColumnNames = ({ survey, nodeDef, includeAnalysis = false }) => [
  columnNameUuid,
  columnNameParentUuid,
  columnNameDateCreated,
  columnNameDateModified,
  ...(NodeDef.isRoot(nodeDef)
    ? [columnNameRecordUuid, columnNameRecordCycle, columnNameRecordStep, columnNameRecordOwnerUuid]
    : []),
  ...R.flatten(
    getNodeDefColumns({ survey, nodeDef, includeAnalysis }).map((nodeDefCol) => DataCol.getNames(nodeDefCol))
  ),
]

// eslint-disable-next-line
/**
 * @deprecated - Use TableDataNodeDef.
 */
export const getRowValuesByColumnName = ({ survey, nodeDef, nodeRow, nodeDefColumns }) => {
  const getRowValuesByColumnName = DataRow.getValuesByColumnName({ survey, nodeRow, nodeDefColumns })
  return {
    [columnNameUuid]: nodeRow[columnNameUuid],
    [columnNameParentUuid]: nodeRow[columnNameAncestorUuid],
    [columnNameDateCreated]: nodeRow[columnNameDateCreated],
    [columnNameDateModified]: nodeRow[columnNameDateModified],
    ...(NodeDef.isRoot(nodeDef)
      ? {
          [columnNameRecordUuid]: nodeRow[columnNameRecordUuid],
          [columnNameRecordCycle]: nodeRow[columnNameRecordCycle],
          [columnNameRecordStep]: nodeRow[columnNameRecordStep],
          [columnNameRecordOwnerUuid]: nodeRow[columnNameRecordOwnerUuid],
        }
      : {}),
    ...getRowValuesByColumnName,
  }
}
