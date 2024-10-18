import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import { TableDataNodeDef } from '@common/model/db'
import * as DataRow from './dataRow'

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
export const getRowValuesByColumnName = ({ survey, nodeDef, nodeRow, nodeDefColumns }) => {
  const getRowValuesByColumnName = DataRow.getValuesByColumnName({ survey, nodeRow, nodeDefColumns })
  const { columnSet, rootDefColumnNames } = TableDataNodeDef
  return {
    [columnSet.uuid]: nodeRow[columnSet.uuid],
    [columnSet.parentUuid]: nodeRow[columnSet.ancestorUuid],
    [columnSet.dateCreated]: nodeRow[columnSet.dateCreated],
    [columnSet.dateModified]: nodeRow[columnSet.dateModified],
    ...(NodeDef.isRoot(nodeDef)
      ? rootDefColumnNames.reduce((acc, colName) => {
          acc[colName] = nodeRow[colName]
          return acc
        }, {})
      : {}),
    ...getRowValuesByColumnName,
  }
}
