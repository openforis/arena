import { db } from '@server/db/db'
import { dbTransformCallback } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as DB from '@common/db'

const { TableChain } = DB.tables
/**
 * Fetches all processing chains by the given survey id and the optional survey cycle if present within params.
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
export const fetchChains = async (params, client = db) => {
  const {
    surveyId,
    cycle = null,
    offset = 0,
    limit = null,
    includeScript = false,
    includeStepsAndCalculations = false,
  } = params

  return client.map(
    `${TableChain.getSelect({ surveyId, cycle, includeScript, includeStepsAndCalculations })}
    ORDER BY ${TableChain.columnDateCreated} DESC
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}`,
    [],
    dbTransformCallback
  )
}
