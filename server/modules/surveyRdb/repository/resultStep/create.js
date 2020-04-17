import { db } from '@server/db/db'

import * as NodeDef from '@core/survey/nodeDef'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'
import * as ResultStepView from '@common/surveyRdb/resultStepView'

/**
 * Creates the result step materialized view.
 *
 * @param {object} params - The query parameters.
 * @param {string} params.surveyId - The survey id.
 * @param {ResultStepView} params.resultStepView - The resultStepView to refresh.
 * @param {pgPromise.IDatabase} client - The database client.
 *
 * @returns {Promise<any>} - The promise returned from the database client.
 */
export const createResultStepView = async ({ surveyId, resultStepView }, client = db) => {
  const schemaRdb = SchemaRdb.getName(surveyId)
  const resultNodeTable = `${schemaRdb}.${ResultNodeTable.tableName}`

  const fields = []
  const joins = []
  let from = ''
  let where = ''

  ResultStepView.getNodeDefColumns(resultStepView).forEach((nodeDef, i) => {
    const alias = `n${i}`
    const nodeDefName = NodeDef.getName(nodeDef)
    const tableWithAlias = `${resultNodeTable} AS ${alias}`
    const conditionNodeDefUuid = `${alias}.${ResultNodeTable.colNames.nodeDefUuid} = '${NodeDef.getUuid(nodeDef)}'`

    fields.push(
      ...(NodeDef.isCode(nodeDef)
        ? [`${alias}.value->'code' AS ${nodeDefName}_code`, `${alias}.value->'label' AS ${nodeDefName}_label`]
        : [`${alias}.value AS ${nodeDefName}`])
    )

    if (i === 0) {
      fields.push(`${alias}.${ResultNodeTable.colNames.parentUuid}`)
      from = `FROM ${tableWithAlias}`
      where = `WHERE ${conditionNodeDefUuid}`
    } else {
      const aliasPrev = `n${i - 1}`
      joins.push(`
        FULL OUTER JOIN ${tableWithAlias}
        ON 
          ${alias}.${ResultNodeTable.colNames.processingStepUuid} = '${ResultStepView.getStepUuid(resultStepView)}'
          AND ${alias}.${ResultNodeTable.colNames.parentUuid} = ${aliasPrev}.${ResultNodeTable.colNames.parentUuid}
        AND ${conditionNodeDefUuid}
      `)
    }
  })

  return client.query(`
    CREATE MATERIALIZED VIEW ${schemaRdb}."${ResultStepView.getViewName(resultStepView)}" AS 
    SELECT ${fields.join(', ')}
    ${from}
    ${joins.join(' ')}
    ${where}
  `)
}
