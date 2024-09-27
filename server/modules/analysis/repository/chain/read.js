import { BaseProtocol } from '@openforis/arena-server'

import { TableChain } from '@common/model/db'
import * as Chain from '@common/analysis/chain'

import * as A from '@core/arena'

import * as DB from '@server/db'

export const transformCallback = (row) => {
  if (!row) return {}
  return A.pipe(DB.mergeProps(), A.camelizePartial({ limitToLevel: 1 }))(row)
}

/**
 * Count the processing chains by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<number>} - The result promise.
 */
export const countChains = async (params, client = DB.client) => {
  const { surveyId } = params
  const tableChain = new TableChain(surveyId)
  return client.one(`${tableChain.getSelect({ surveyId, count: true })}`, [], (row) => Number(row.count))
}

/**
 * Fetches all processing chains by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {number} [params.offset=0] - The select query offset.
 * @param {number} [params.limit=null] - The select query limit.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchChains = async (params, client = DB.client) => {
  const { surveyId, offset = 0, limit = null, includeScript = false } = params

  const tableChain = new TableChain(surveyId)

  return client.map(
    `${tableChain.getSelect({ surveyId, includeScript })}
    ORDER BY ${tableChain.columnDateCreated} DESC
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}`,
    [],
    transformCallback
  )
}

/**
 * Fetches a single processing chain by the given survey id and chainUuid.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.chainUuid - The processing chain uuid.
 * @param {boolean} params.includeScript - Whether to include script columns.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<Chain|null>} - The result promise.
 */
export const fetchChain = async (params, client = DB.client) => {
  const { surveyId, chainUuid, includeScript = false } = params

  const tableChain = new TableChain(surveyId)

  return client.oneOrNone(tableChain.getSelect({ chainUuid, includeScript }), [chainUuid], transformCallback)
}
