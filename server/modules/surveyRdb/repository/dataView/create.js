import * as Survey from '../../../../../core/survey/survey'
import * as SchemaRdb from '../../../../../common/surveyRdb/schemaRdb'

import * as DataTable from '../../schemaRdb/dataTable'
import * as DataView from '../../schemaRdb/dataView'

const toTableViewCreate = (survey, nodeDef, resultStepViews) => {
  const surveyId = Survey.getId(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  const schemaName = SchemaRdb.getName(surveyId)
  const tableName = DataTable.getName(nodeDef, nodeDefParent)
  return {
    schemaName,
    tableName,
    viewName: DataView.getName(nodeDef, nodeDefParent),
    viewFields: DataView.getSelectFields(survey, nodeDef, resultStepViews),
    viewFrom: `${DataView.getFromTable(survey, nodeDef)} as ${DataView.alias}`,
    viewJoin: DataView.getJoin(schemaName, nodeDef, nodeDefParent),
    viewJoinResultViews: DataView.getJoinResultStepView(survey, nodeDef, resultStepViews),
    viewWhereCondition: DataView.getWhereCondition(nodeDef),
  }
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
export const createView = async ({ survey, nodeDef, resultStepViews }, client) => {
  const tableViewCreate = toTableViewCreate(survey, nodeDef, resultStepViews)

  return client.query(`
    CREATE VIEW
      ${tableViewCreate.schemaName}.${tableViewCreate.viewName} AS 
      SELECT ${tableViewCreate.viewFields.join(', ')}
      FROM ${tableViewCreate.viewFrom}
      ${tableViewCreate.viewJoin}
      ${tableViewCreate.viewJoinResultViews}
      ${tableViewCreate.viewWhereCondition}
  `)
}
