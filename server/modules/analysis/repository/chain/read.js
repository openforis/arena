import { BaseProtocol, Schemata } from '@openforis/arena-server'

import * as DB from '../../../../db'

import * as ObjectUtils from '../../../../../core/objectUtils'
import { TableChain } from '../../../../../common/model/db'
import * as Chain from '@common/analysis/chain'

export const transformCallback = (row) => {
  if (!row) return {}
  /* eslint-disable-next-line camelcase */
  const { date_created, date_modified, ...rest } = DB.mergeProps()(row)

  return {
    /* eslint-disable-next-line camelcase */
    ...(date_created ? { [ObjectUtils.keys.dateCreated]: date_created } : {}),
    /* eslint-disable-next-line camelcase */
    ...(date_modified ? { [ObjectUtils.keys.dateModified]: date_modified } : {}),
    ...rest,
  }
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
  const schema = Schemata.getSchemaSurvey(surveyId)
  const chainColumns = TableChain.columnSet

  return client.oneOrNone(
    ` SELECT
  ${Object.values(chainColumns)
    .map((columnName) => `_c.${columnName}`)
    .join(',')}
  FROM
    ${schema}.${TableChain.tableName} AS _c
  WHERE _c.uuid = $1
  GROUP BY _c.uuid`,
    [chainUuid],
    transformCallback
  )
}
