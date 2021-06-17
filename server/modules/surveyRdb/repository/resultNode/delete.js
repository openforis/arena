import * as pgPromise from 'pg-promise'

import * as Chain from '@common/analysis/chain'

import { db } from '@server/db/db'
import { TableDataNodeDef } from '@common/model/db'

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

  const columnsNames = Chain.getColumnsNamesInEntity({ entity })(chain)
  return client.query(
    `UPDATE ${tableData.nameQualified}
    SET 
      ${columnsNames.map((name) => `${name} = DEFAULT `).join(',')}
    WHERE
      ${TableDataNodeDef.columnSet.recordCycle} = $1
  `,
    [String(cycle)]
  )
}
