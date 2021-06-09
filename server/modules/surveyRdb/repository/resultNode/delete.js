import * as pgPromise from 'pg-promise'

import { db } from '@server/db/db'
import { TableRecord, TableResultNode } from '@common/model/db'

/**
 * Deletes the nodes of the result node table for the specified processing chain.
 *
 * @param {!object} params - Filter parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string} params.cycle - The survey cycle.
 * @param {!string} params.chainUuid - The processing chain uuid.
 * @param {!pgPromise.IDatabase} client - The database client.
 */
export const deleteNodeResultsByChainUuid = async ({ surveyId, cycle, chainUuid }, client = db) => {
  const tableResultNode = new TableResultNode(surveyId)
  const tableRecord = new TableRecord(surveyId)


  return client.query(
    `DELETE
  FROM
      ${tableResultNode.nameQualified}
  WHERE
      ${TableResultNode.columnSet.chainUuid} = $1
  AND ${TableResultNode.columnSet.recordUuid} IN
  (
      SELECT ${tableRecord.columnUuid}
      FROM ${tableRecord.nameAliased}
      WHERE ${tableRecord.columnCycle} = $2
  )`,
    [chainUuid, cycle]
  )
}
