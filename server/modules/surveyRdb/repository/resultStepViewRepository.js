import { db } from '@server/db/db'

import * as NodeDef from '@core/survey/nodeDef'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'
import * as ResultStepView from '@common/surveyRdb/resultStepView'
import * as UserAnalysis from '@common/analysis/userAnalysis'

// ====== CREATE

export const createResultStepView = async (surveyId, resultStepView, client) => {
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

  await client.query(`
    CREATE MATERIALIZED VIEW ${schemaRdb}."${ResultStepView.getViewName(resultStepView)}" AS 
    SELECT ${fields.join(', ')}
    ${from}
    ${joins.join(' ')}
    ${where}
  `)
}

// ====== UPDATE

export const refreshResultStepView = async (surveyId, resultStepView, client = db) =>
  client.query(
    `REFRESH MATERIALIZED VIEW ${SchemaRdb.getName(surveyId)}."${ResultStepView.getViewName(resultStepView)}"`
  )

export const updateOwnerToUserAnalysis = async (surveyId, viewName, client) =>
  client.query(`
    ALTER MATERIALIZED VIEW ${SchemaRdb.getName(surveyId)}."${viewName}"
    OWNER TO ${UserAnalysis.getName(surveyId)}
  `)
