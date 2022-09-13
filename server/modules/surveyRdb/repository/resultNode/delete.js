import * as pgPromise from 'pg-promise'

import * as Survey from '@core/survey/survey'

import { db } from '@server/db/db'
import { TableDataNodeDef, ViewDataNodeDef } from '@common/model/db'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

/**
 * Deletes the nodes of the result node table for the specified processing chain.
 *
 * @param {!object} params - Filter parameters.
 * @param {!object} params.survey - The survey.
 * @param {!object} params.entity - The entity.
 * @param {!string} params.cycle - The survey cycle.
 * @param {!pgPromise.IDatabase} client - The database client.
 */
export const deleteNodeResultsByChainUuid = async ({ survey, chain, entity, cycle }, client = db) => {
  const tableData = new TableDataNodeDef(survey, entity)
  const viewData = new ViewDataNodeDef(survey, entity)

  const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({
    entity,
    chain,
    showInactiveResultVariables: true,
    showSamplingNodeDefs: true,
  })(survey)
  const columnNames = NodeDefTable.getNodeDefsColumnNames({
    nodeDefs: analysisNodeDefsInEntity,
    includeExtendedCols: true,
  })

  return client.query(
    `UPDATE ${tableData.nameQualified}
    SET 
      ${columnNames.map((name) => `${name} = DEFAULT`).join(', ')}
    WHERE ${TableDataNodeDef.columnSet.id} IN (
      SELECT ${viewData.columnIdName}
      FROM ${viewData.nameQualified}
      WHERE ${ViewDataNodeDef.columnSet.recordCycle} = $1
    )
  `,
    [String(cycle)]
  )
}
