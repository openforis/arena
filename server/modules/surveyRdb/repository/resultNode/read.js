import * as pgPromise from 'pg-promise'
import * as camelize from 'camelize'

import { db } from '@server/db/db'
import { TableResultNode } from '@common/model/db'

/**
 * Reads the nodes of the result node table for the specified recordUuid and nodeDefUuid.
 *
 * @param {!object} params - Filter parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string} params.recordUuid - The record uuid.
 * @param {!string} params.parentUuid - The parent node uuid.
 * @param {!string} params.nodeDefUuid - The node definition uuid.
 * @param {!pgPromise.IDatabase} client - The database client.
 */
export const fetchNodeResultsByRecordAndNodeDefUuid = async (
  { surveyId, recordUuid, parentUuid, nodeDefUuid },
  client = db
) => {
  const tableResultNode = new TableResultNode(surveyId)

  return client.map(
    `SELECT *
    FROM
        ${tableResultNode.nameQualified}
    WHERE
        ${TableResultNode.columnSet.recordUuid} = $1
    AND ${TableResultNode.columnSet.parentUuid} = $2
    AND ${TableResultNode.columnSet.nodeDefUuid} = $3`,
    [recordUuid, parentUuid, nodeDefUuid],
    camelize
  )
}
