import * as NodeDef from '@core/survey/nodeDef'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'
import * as ResultStepView from '@common/surveyRdb/resultStepView'
import * as UserAnalysis from '@common/analysis/userAnalysis'

// ===== CREATE
export const createResultStepView = async (surveyId, resultStepView, client) => {
  const schemaRdb = SchemaRdb.getName(surveyId)
  const resultNodeTable = `${schemaRdb}.${ResultNodeTable.tableName}`

  const fields = []
  const joins = []
  let from = ''
  let where = ''

  ResultStepView.getNodeDefColumns(resultStepView).forEach((nodeDef, i) => {
    const alias = `n${i}`
    const tableWithAlias = `${resultNodeTable} AS ${alias}`
    const conditionNodeDefUuid = `${alias}.${ResultNodeTable.colNames.nodeDefUuid} = '${NodeDef.getUuid(nodeDef)}'`

    fields.push(`${alias}.value AS ${NodeDef.getName(nodeDef)}`)

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

export const updateOwnerToUserAnalysis = async (surveyId, viewName, client) =>
  await client.query(`
    ALTER MATERIALIZED VIEW ${SchemaRdb.getName(surveyId)}."${viewName}"
    OWNER TO ${UserAnalysis.getName(surveyId)}
  `)
