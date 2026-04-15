import * as pgPromise from 'pg-promise'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as DbUtils from '@server/db/dbUtils'

import * as SQL from '@common/model/db/sql'
import { ColumnNodeDef, TableDataNodeDef, ViewDataNodeDef } from '@common/model/db'

const canJoinWithMultipleAttributeTable = ({ nodeDef, viewNodeDef }) =>
  NodeDef.isMultipleAttribute(nodeDef) &&
  NodeDef.canMultipleAttributeBeAggregated(nodeDef) &&
  !NodeDef.isEqual(nodeDef)(viewNodeDef) &&
  NodeDef.isDescendantOf(viewNodeDef)(nodeDef)

const _getSelectFieldNodeDefs = (viewDataNodeDef) =>
  viewDataNodeDef.columnNodeDefs.flatMap((columnNodeDef) => {
    const { nodeDef: viewNodeDef, tableData, survey } = viewDataNodeDef
    const { nodeDef, name: colName, names: colNames, namesFull } = columnNodeDef
    const isMultipleAttribute = NodeDef.isMultipleAttribute(nodeDef)
    if (NodeDef.isEqual(nodeDef)(viewNodeDef)) {
      if (!isMultipleAttribute) {
        return [`${tableData.columnUuid} AS ${colName}`]
      }
    } else if (isMultipleAttribute && NodeDef.isDescendantOf(viewNodeDef)(nodeDef)) {
      if (canJoinWithMultipleAttributeTable({ nodeDef, viewNodeDef })) {
        const multAttrDataTable = new TableDataNodeDef(survey, nodeDef)
        return colNames.map((colName) => `${DbUtils.asName(multAttrDataTable.alias)}.${DbUtils.asName(colName)}`)
      } else {
        // skip multiple attributes that cannot be aggregated into a single column yet
        return []
      }
    }
    return namesFull
  })

const _getSelectFieldKeys = (viewDataNodeDef) => {
  const nodeDefKeys = Survey.getNodeDefKeys(viewDataNodeDef.nodeDef)(viewDataNodeDef.survey)
  const keys = nodeDefKeys.flatMap((nodeDef) => {
    const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDef)
    return [
      `'${NodeDef.getUuid(nodeDef)}'`,
      `${DbUtils.asName(viewDataNodeDef.tableData.alias)}.${DbUtils.asName(columnNodeDef.name)}`,
    ]
  })
  return `${SQL.jsonBuildObject(...keys)} AS ${ViewDataNodeDef.columnSet.keys}`
}

const _getJoinWithMultipleAttributeTable = ({ viewDataNodeDef, multAttrColumnNodeDef }) => {
  const { survey, tableData } = viewDataNodeDef
  const { nodeDef: multAttrDef, names: columnNames } = multAttrColumnNodeDef
  const multAttrDataTable = new TableDataNodeDef(survey, multAttrDef)
  const tableNameAliasQuoted = DbUtils.asName(multAttrDataTable.alias)

  return `LEFT JOIN 
  (
    SELECT 
      ${multAttrDataTable.columnParentUuid}, 
      ${columnNames.map((colName) => `json_agg(${tableNameAliasQuoted}.${DbUtils.asName(colName)}) AS ${DbUtils.asName(colName)}`).join(', ')}
    FROM ${multAttrDataTable.nameAliased}
    GROUP BY ${multAttrDataTable.columnParentUuid}
  ) AS ${tableNameAliasQuoted}
  ON ${multAttrDataTable.columnParentUuid} = ${tableData.columnUuid}`
}

const _getJoinsWithMultipleAttributeDataTables = (viewDataNodeDef) => {
  const { columnNodeDefs, nodeDef: viewNodeDef } = viewDataNodeDef

  const multAttributeColumnNodeDefs = columnNodeDefs.filter((columnNodeDef) =>
    canJoinWithMultipleAttributeTable({ nodeDef: columnNodeDef.nodeDef, viewNodeDef })
  )

  return multAttributeColumnNodeDefs
    .map((multAttrColumnNodeDef) => _getJoinWithMultipleAttributeTable({ viewDataNodeDef, multAttrColumnNodeDef }))
    .join(' ')
}

/**
 * Create a nodeDef data view.
 * @param {object} params - The query parameters.
 * @param {Survey} params.survey - The survey.
 * @param {NodeDef} params.nodeDef - The nodeDef to create the data view for.
 * @param {pgPromise.IDatabase} client - The data base client.
 * @returns {Promise<null|*>} - The result promise.
 */
export const createDataView = async ({ survey, nodeDef }, client) => {
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)
  const { tableData, viewDataParent } = viewDataNodeDef

  // TODO - do not use select * from virtual entities, it includes parent_uuid column (see https://github.com/openforis/arena/issues/728)
  const selectFields = viewDataNodeDef.virtual
    ? ['*']
    : [
        `${tableData.columnId} AS ${viewDataNodeDef.columnIdName}`,
        ...(viewDataNodeDef.root
          ? [
              tableData.columnRecordUuid,
              tableData.columnRecordCycle,
              tableData.columnRecordStep,
              tableData.columnRecordOwnerUuid,
            ]
          : [
              viewDataParent.columnRecordUuid,
              viewDataParent.columnRecordCycle,
              viewDataParent.columnRecordStep,
              viewDataParent.columnRecordOwnerUuid,
            ]),
        tableData.columnDateCreated,
        tableData.columnDateModified,
        _getSelectFieldKeys(viewDataNodeDef),
        ..._getSelectFieldNodeDefs(viewDataNodeDef),
      ]

  const joinWithParentView = viewDataParent
    ? `LEFT JOIN ${viewDataParent.nameAliased}  
            ON ${viewDataParent.columnUuid} = ${tableData.columnParentUuid}`
    : ''

  const query = `
    CREATE VIEW ${viewDataNodeDef.nameQualified} AS ( 
      SELECT 
        ${selectFields.filter(Boolean).join(', ')}
      FROM 
        ${tableData.nameAliased}
      ${joinWithParentView}
      ${_getJoinsWithMultipleAttributeDataTables(viewDataNodeDef)}
      ${viewDataNodeDef.virtualExpression ? `WHERE ${viewDataNodeDef.virtualExpression}` : ''}
     )`
  return client.query(query)
}
