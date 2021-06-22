import * as Chain from '@common/analysis/chain'

import * as DB from '../../../../db'

import { TableChain } from '../../../../../common/model/db'

/**
 * Delete processing chain(s) according to query parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.chainUuid=null] - The chain uuid to delete.
 * @param {boolean} [params.noCycle=false] - Whether to delete chains with no cycles.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const deleteChain = async (params, client = DB.client) => {
  const { surveyId, chainUuid = null, noCycle = false } = params

  if (!chainUuid && !noCycle)
    throw new Error(`One between chainUuid and noCycle are required. {chainUuid:${chainUuid}, noCycle:${noCycle}}`)

  const tableChain = new TableChain(surveyId)

  return client.any(
    `DELETE FROM ${tableChain.nameQualified}
    WHERE 
    ${chainUuid ? TableChain.columnSet.uuid : `jsonb_array_length(props->'${Chain.keysProps.cycles}')`} = $1
    RETURNING *`,
    chainUuid ? [chainUuid] : [0],
    DB.transformCallback
  )
}
