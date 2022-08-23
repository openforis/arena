import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import { TableDataNodeDef } from '../../../../../common/model/db'

/**
 * Create a nodeDef data table.
 *
 * @param {object} params - The query parameters.
 * @param {Survey} params.survey - The survey.
 * @param {NodeDef} params.nodeDef - The nodeDef to create the data table for.
 * @param {pgPromise.IDatabase} client - The data base client.
 *
 * @returns {Promise<null|*>} - The result promise.
 */
export const createDataTable = async ({ survey, nodeDef }, client) => {
  if (NodeDef.isVirtual(nodeDef)) {
    return null
  }

  const tableDataNodeDef = new TableDataNodeDef(survey, nodeDef)
  const constraintFkParent = tableDataNodeDef.getConstraintFkParent()
  const constraintFkRecord = tableDataNodeDef.getConstraintFkRecord()

  return client.query(
    `CREATE TABLE
        ${tableDataNodeDef.nameQualified}
      (
        ${tableDataNodeDef.getColumnsWithType().join(', ')},
        ${tableDataNodeDef.getConstraintUuidUnique()},
        ${constraintFkParent ? `${constraintFkParent}, ` : ''}
        ${constraintFkRecord ? `${constraintFkRecord}, ` : ''}
        PRIMARY KEY (${TableDataNodeDef.columnSet.id})
      )`
  )
}
