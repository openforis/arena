import * as pgPromise from 'pg-promise'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import * as SQL from '../../../../../common/model/db/sql'
import { ColumnNodeDef, TableDataNodeDef, ViewDataNodeDef } from '../../../../../common/model/db'

const _canMultipleNodeDefBeAggregated = (nodeDef) =>
  NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef) || NodeDef.isText(nodeDef)

const _getMultipleAttributeInnerSelect = ({ viewDataNodeDef, columnNodeDef }) => {
  const { survey, tableData } = viewDataNodeDef

  const multAttrDef = columnNodeDef.nodeDef
  const multAttrDataNodeDef = new TableDataNodeDef(survey, multAttrDef)
  const nodeDefName = NodeDef.getName(columnNodeDef.nodeDef)
  const multAttrDataTable = new TableDataNodeDef(survey, multAttrDef)

  return `SELECT json_agg(${multAttrDataNodeDef.alias}.${nodeDefName}) 
          FROM ${multAttrDataTable.nameAliased}
          WHERE ${multAttrDataTable.columnRecordUuid} = ${tableData.columnRecordUuid}
            AND ${multAttrDataTable.columnParentUuid} = ${tableData.columnUuid}`
}

const _getSelectFieldNodeDefs = (viewDataNodeDef) =>
  viewDataNodeDef.columnNodeDefs.flatMap((columnNodeDef) => {
    const { tableData } = viewDataNodeDef
    if (NodeDef.isEqual(columnNodeDef.nodeDef)(viewDataNodeDef.nodeDef)) {
      if (!NodeDef.isMultipleAttribute(columnNodeDef.nodeDef)) {
        return [`${tableData.columnUuid} AS ${columnNodeDef.name}`]
      }
    } else if (NodeDef.isMultipleAttribute(columnNodeDef.nodeDef)) {
      if (_canMultipleNodeDefBeAggregated(columnNodeDef.nodeDef)) {
        return [`(${_getMultipleAttributeInnerSelect({ viewDataNodeDef, columnNodeDef })}) AS ${columnNodeDef.name}`]
      } else {
        // skip multiple attributes that cannot be aggregated into a single column yet
        return []
      }
    }
    return columnNodeDef.namesFull
  })

const _getSelectFieldKeys = (viewDataNodeDef) => {
  const keys = Survey.getNodeDefKeys(viewDataNodeDef.nodeDef)(viewDataNodeDef.survey)
    .map((nodeDef) => {
      const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDef)
      return [`'${NodeDef.getUuid(nodeDef)}'`, `${viewDataNodeDef.tableData.alias}.${columnNodeDef.name}`]
    })
    .flat()
  return keys.length > 0 ? `${SQL.jsonBuildObject(...keys)} AS ${ViewDataNodeDef.columnSet.keys}` : ''
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
        tableData.columnRecordUuid,
        tableData.columnRecordCycle,
        tableData.columnDateCreated,
        tableData.columnDateModified,
        _getSelectFieldKeys(viewDataNodeDef),
        ..._getSelectFieldNodeDefs(viewDataNodeDef),
      ]

  const shouldJoinWithParentView = !viewDataNodeDef.virtual && !viewDataNodeDef.root

  const query = `
    CREATE VIEW ${viewDataNodeDef.nameQualified} AS ( 
      SELECT 
        ${selectFields.filter(Boolean).join(', ')}
      FROM 
        ${tableData.nameAliased}
      ${
        shouldJoinWithParentView
          ? `LEFT JOIN ${viewDataParent.nameAliased}  
            ON ${viewDataParent.columnUuid} = ${tableData.columnParentUuid}`
          : ''
      }
      ${viewDataNodeDef.virtualExpression ? `WHERE ${viewDataNodeDef.virtualExpression}` : ''}
     )`

  return client.query(query)
}
