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
 * Count the processing chains by the given survey id and the optional survey cycle.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.cycle=null] - The survey cycle.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<number>} - The result promise.
 */
export const countChains = async (params, client = DB.client) => {
  const { surveyId, cycle = null } = params
  const tableChain = new TableChain(surveyId)
  return client.one(`${tableChain.getSelect({ surveyId, cycle, count: true })}`, [], (row) => Number(row.count))
}

/**
 * Fetches all processing chains by the given survey id and the optional survey cycle.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.cycle=null] - The survey cycle.
 * @param {number} [params.offset=0] - The select query offset.
 * @param {number} [params.limit=null] - The select query limit.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchChains = async (params, client = DB.client) => {
  const { surveyId, cycle = null, offset = 0, limit = null, includeScript = false } = params

  const tableChain = new TableChain(surveyId)

  return client.map(
    `${tableChain.getSelect({ surveyId, cycle, includeScript })}
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
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<Chain|null>} - The result promise.
 */
export const fetchChain = async (params, client = DB.client) => {
  const { surveyId, chainUuid } = params

  const tableChain = new TableChain(surveyId)

  return client.oneOrNone(tableChain.getSelect({ chainUuid }), [chainUuid], transformCallback)
}
