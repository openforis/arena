import * as DB from '../../../../db'

import * as ObjectUtils from '../../../../../core/objectUtils'
import { TableChain } from '../../../../../common/model/db'
import * as Chain from '../../../../../common/analysis/processingChain'

const transformCallback = (row) => {
  if (!row) return {}
  /* eslint-disable-next-line camelcase */
  const { date_created, date_modified, ...rest } = DB.mergeProps()(row)

  return {
    /* eslint-disable-next-line camelcase */
    ...(date_created ? { [ObjectUtils.keys.dateCreated]: date_created } : {}),
    /* eslint-disable-next-line camelcase */
    ...(date_modified ? { [ObjectUtils.keys.dateModified]: date_modified } : {}),
    ...(rest || {}),
  }
}

/**
 * Count the processing chains by the given survey id and the optional survey cycle.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.cycle=null] - The survey cycle.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<number>} - The result promise.
 */
export const countChains = async (params, client = DB.client) => {
  const { surveyId, cycle = null } = params
  const tableChain = new TableChain(surveyId)
  return client.one(`${tableChain.getSelect({ surveyId, cycle, count: true })}`)
}

/**
 * Fetches all processing chains by the given survey id and the optional survey cycle.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.cycle=null] - The survey cycle.
 * @param {number} [params.offset=0] - The select query offset.
 * @param {number} [params.limit=null] - The select query limit.
 * @param {boolean} [params.includeStepsAndCalculations=false] - Whether to include the processing steps and calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchChains = async (params, client = DB.client) => {
  const {
    surveyId,
    cycle = null,
    offset = 0,
    limit = null,
    includeScript = false,
    includeStepsAndCalculations = false,
  } = params

  const tableChain = new TableChain(surveyId)

  return client.map(
    `${tableChain.getSelect({ surveyId, cycle, includeScript, includeStepsAndCalculations })}
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
 * @param {boolean} [params.includeStepsAndCalculations=false] - Whether to include the processing steps and calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Chain|null>} - The result promise.
 */
export const fetchChain = async (params, client = DB.client) => {
  const { surveyId, chainUuid, includeScript = false, includeStepsAndCalculations = false } = params

  const tableChain = new TableChain(surveyId)

  return client.oneOrNone(
    tableChain.getSelect({ surveyId, chainUuid, includeScript, includeStepsAndCalculations }),
    [],
    transformCallback
  )
}
