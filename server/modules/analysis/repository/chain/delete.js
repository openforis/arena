import * as DB from '../../../../db'

import { TableChain } from '../../../../../common/model/db'

/**
 * Delete processing chain(s) according to query parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} [params.chainUuid] - The chain uuid to delete.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const deleteChain = async (params, client = DB.client) => {
  const { surveyId, chainUuid } = params

  const tableChain = new TableChain(surveyId)

  return client.one(
    `DELETE FROM ${tableChain.nameQualified}
    WHERE ${TableChain.columnSet.uuid} = $1
    RETURNING *`,
    [chainUuid],
    DB.transformCallback
  )
}
