import * as pgPromise from 'pg-promise'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import * as SQL from '../../../../../common/model/db/sql'
import { ColumnNodeDef, TableDataNodeDef, ViewDataNodeDef } from '../../../../../common/model/db'

const _canMultipleNodeDefBeAggregated = (nodeDef) =>
  NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef) || NodeDef.isText(nodeDef)

const _getSelectFieldNodeDefs = (viewDataNodeDef) =>
  viewDataNodeDef.columnNodeDefs
    .map((columnNodeDef) => {
      if (NodeDef.isEqual(columnNodeDef.nodeDef)(viewDataNodeDef.nodeDef)) {
        if (!NodeDef.isMultipleAttribute(columnNodeDef.nodeDef)) {
          return [`${viewDataNodeDef.tableData.columnUuid} AS ${columnNodeDef.name}`]
        }
      } else if (
        NodeDef.isMultipleAttribute(columnNodeDef.nodeDef) &&
        _canMultipleNodeDefBeAggregated(columnNodeDef.nodeDef)
      ) {
        const multAttrDataNodeDef = new TableDataNodeDef(viewDataNodeDef.survey, columnNodeDef.nodeDef)
        const nodeDefName = NodeDef.getName(columnNodeDef.nodeDef)
        return `json_agg(${multAttrDataNodeDef.alias}.${nodeDefName}) AS ${nodeDefName}`
      }
      return columnNodeDef.namesFull
    })
    .flat()

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

  const multipleAttributeDataTableJoins = Survey.getNodeDefChildren(
    viewDataNodeDef.nodeDef,
    true
  )(survey)
    .filter(
      (nodeDefChild) => NodeDef.isMultipleAttribute(nodeDefChild) && _canMultipleNodeDefBeAggregated(nodeDefChild)
    )
    .map((multAttrDef) => {
      const multAttrDataTable = new TableDataNodeDef(survey, multAttrDef)
      return `LEFT JOIN ${multAttrDataTable.nameAliased} 
            ON ${multAttrDataTable.columnRecordUuid} = ${tableData.columnRecordUuid}
            AND ${multAttrDataTable.columnParentUuid} = ${tableData.columnUuid}`
    })
    .join('\n')

  const groupByColumns = []
  if (!NodeDef.isMultipleAttribute(viewDataNodeDef.nodeDef) && multipleAttributeDataTableJoins) {
    groupByColumns.push(tableData.columnId)

    if (shouldJoinWithParentView) {
      groupByColumns.push(viewDataParent.columnUuid)
    }
  }

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
      ${multipleAttributeDataTableJoins}
      ${viewDataNodeDef.virtualExpression ? `WHERE ${viewDataNodeDef.virtualExpression}` : ''}
      ${groupByColumns.length > 0 ? `GROUP BY ${groupByColumns.join(', ')}` : ''}
     )`

  return client.query(query)
}
