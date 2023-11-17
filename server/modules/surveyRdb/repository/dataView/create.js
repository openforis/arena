import * as pgPromise from 'pg-promise'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import * as SQL from '../../../../../common/model/db/sql'
import { ColumnNodeDef, TableDataNodeDef, ViewDataNodeDef } from '../../../../../common/model/db'

const _getSelectFieldNodeDefs = (viewDataNodeDef) =>
  viewDataNodeDef.columnNodeDefs.flatMap((columnNodeDef) => {
    const { tableData, survey } = viewDataNodeDef
    const { nodeDef } = columnNodeDef
    if (NodeDef.isEqual(nodeDef)(viewDataNodeDef.nodeDef)) {
      if (!NodeDef.isMultipleAttribute(nodeDef)) {
        return [`${tableData.columnUuid} AS ${columnNodeDef.name}`]
      }
    } else if (NodeDef.isMultipleAttribute(nodeDef)) {
      if (NodeDef.canMultipleAttributeBeAggregated(nodeDef)) {
        const multAttrDataTable = new TableDataNodeDef(survey, nodeDef)
        return columnNodeDef.names.map((colName) => `${multAttrDataTable.alias}.${colName}`)
        // return [`(${_getMultipleAttributeInnerSelect({ viewDataNodeDef, columnNodeDef })})`]
      } else {
        // skip multiple attributes that cannot be aggregated into a single column yet
        return []
      }
    }
    return columnNodeDef.namesFull
  })

const _getSelectFieldKeys = (viewDataNodeDef) => {
  const nodeDefKeys = Survey.getNodeDefKeys(viewDataNodeDef.nodeDef)(viewDataNodeDef.survey)
  const keys = nodeDefKeys.flatMap((nodeDef) => {
    const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDef)
    return [`'${NodeDef.getUuid(nodeDef)}'`, `${viewDataNodeDef.tableData.alias}.${columnNodeDef.name}`]
  })
  return `${SQL.jsonBuildObject(...keys)} AS ${ViewDataNodeDef.columnSet.keys}`
}

const _getJoinWithMultipleAttributeTable = ({ viewDataNodeDef, multAttrColumnNodeDef }) => {
  const { survey, tableData } = viewDataNodeDef
  const { nodeDef: multAttrDef, names: columnNames } = multAttrColumnNodeDef
  const multAttrDataTable = new TableDataNodeDef(survey, multAttrDef)

  return `LEFT JOIN 
  (
    SELECT 
      ${multAttrDataTable.columnParentUuid}, 
      ${columnNames.map((colName) => `json_agg(${multAttrDataTable.alias}.${colName}) AS ${colName}`).join(', ')}
    FROM ${multAttrDataTable.nameAliased}
    GROUP BY ${multAttrDataTable.columnParentUuid}
  ) AS ${multAttrDataTable.alias}
  ON ${multAttrDataTable.columnParentUuid} = ${tableData.columnUuid}`
}

const _getJoinsWithMultipleAttributeDataTables = (viewDataNodeDef) => {
  const { columnNodeDefs, nodeDef: viewNodeDef } = viewDataNodeDef
  if (NodeDef.isMultipleAttribute(viewNodeDef)) return ''

  const multAttributeColumnNodeDefs = columnNodeDefs.filter((columnNodeDef) => {
    const { nodeDef } = columnNodeDef
    return NodeDef.isMultipleAttribute(nodeDef) && NodeDef.canMultipleAttributeBeAggregated(nodeDef)
  })
  return multAttributeColumnNodeDefs
    .map((multAttrColumnNodeDef) => _getJoinWithMultipleAttributeTable({ viewDataNodeDef, multAttrColumnNodeDef }))
    .join(' ')
}

/**
 * Create a nodeDef data view.
 *
 * @param {object} params - The query parameters.
 * @param {Survey} params.survey - The survey.
 * @param {NodeDef} params.nodeDef - The nodeDef to create the data view for.
 * @param {pgPromise.IDatabase} client - The data base client.
 *
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

  const jointWithParentView = viewDataParent
    ? `LEFT JOIN ${viewDataParent.nameAliased}  
            ON ${viewDataParent.columnUuid} = ${tableData.columnParentUuid}`
    : ''

  const query = `
    CREATE VIEW ${viewDataNodeDef.nameQualified} AS ( 
      SELECT 
        ${selectFields.filter(Boolean).join(', ')}
      FROM 
        ${tableData.nameAliased}
      ${jointWithParentView}
      ${_getJoinsWithMultipleAttributeDataTables(viewDataNodeDef)}
      ${viewDataNodeDef.virtualExpression ? `WHERE ${viewDataNodeDef.virtualExpression}` : ''}
     )`

  return client.query(query)
}
