import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import * as SQL from '../../../../../common/model/db/sql'
import { ColumnNodeDef, ViewDataNodeDef, TableDataNodeDef } from '../../../../../common/model/db'

const _getSelectFieldNodeDefs = (viewDataNodeDef) =>
  viewDataNodeDef.columnNodeDefs
    .map((columnNodeDef) => {
      if (NodeDef.isEqual(columnNodeDef.nodeDef)(viewDataNodeDef.nodeDef)) {
        return [`${viewDataNodeDef.tableData.alias}.${TableDataNodeDef.columnSet.uuid} AS ${columnNodeDef.name}`]
      }
      return columnNodeDef.namesFull
    })
    .flat()

const _getSelectFieldSteps = (viewDataNodeDef) =>
  viewDataNodeDef.viewResultSteps
    .map((viewResultStep) => viewResultStep.columnNodeDefs.map((columnNodeDef) => columnNodeDef.namesFull))
    .flat(Infinity)

const _getSelectFieldKeys = (viewDataNodeDef) => {
  const keys = Survey.getNodeDefKeys(viewDataNodeDef.nodeDef)(viewDataNodeDef.survey)
    .map((nodeDef) => {
      const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDef)
      return [`'${NodeDef.getUuid(nodeDef)}'`, `${viewDataNodeDef.tableData.alias}.${columnNodeDef.name}`]
    })
    .flat()
  return `${SQL.jsonBuildObject(...keys)} AS ${ViewDataNodeDef.columnSet.keys}`
}

/**
 * Create a nodeDef data view.
 *
 * @param {object} params - The query parameters.
 * @param {Survey} params.survey - The survey.
 * @param {NodeDef} params.nodeDef - The nodeDef to create the data view for.
 * @param {ProcessingStep[]} params.steps - The processing steps linked to the nodeDef.
 * @param {pgPromise.IDatabase} client - The data base client.
 *
 * @returns {Promise<null|*>} - The result promise.
 */
export const createDataView = async ({ survey, nodeDef, steps }, client) => {
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef, steps)
  const { schema, name, tableData, viewDataParent, viewResultSteps, root, virtual, virtualExpression } = viewDataNodeDef

  // TODO - do not use select * from virtual entities, it includes parent_uuid column (see https://github.com/openforis/arena/issues/728)
  const selectFields = virtual
    ? ['*']
    : [
        tableData.columnRecordUuid,
        tableData.columnRecordCycle,
        tableData.columnDateCreated,
        tableData.columnDateModified,
        _getSelectFieldKeys(viewDataNodeDef),
        ..._getSelectFieldNodeDefs(viewDataNodeDef),
        ..._getSelectFieldSteps(viewDataNodeDef),
      ]

  const query = `
    CREATE VIEW ${schema}.${name} AS ( 
      SELECT 
        ${selectFields.join(', ')}
      FROM 
        ${tableData.nameFull}
      ${
        virtual || root
          ? ''
          : `LEFT JOIN ${viewDataParent.nameFull}  
            ON ${viewDataParent.columnUuid} = ${tableData.columnParentUuid}`
      }
      ${viewResultSteps
        .map(
          (viewResultStep) =>
            `LEFT OUTER JOIN ${viewResultStep.nameFull}
            ON ${viewResultStep.columnParentUuid} = ${tableData.columnUuid}
            `
        )
        .join('')}
      ${virtualExpression ? `WHERE ${virtualExpression}` : ''}
     )`

  return client.query(query)
}
