import * as DB from '../../../../db'

import { TableStep } from '../../../../../common/model/db'
import * as Step from '../../../../../common/analysis/processingStep'

/**
 * Fetches all processing steps by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter by.
 * @param {string} [params.entityUuid=null] - The entity uuid to filter by.
 * @param {boolean} [params.includeCalculations=false] - Whether to include calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include calculations script.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Step[]>} - The result promise.
 */
export const fetchSteps = async (params, client = DB.client) => {
  const { surveyId, chainUuid = null, entityUuid = null, includeScript = false, includeCalculations = false } = params
  const tableStep = new TableStep(surveyId)
  return client.map(
    `${tableStep.getSelect({ chainUuid, entityUuid, includeScript, includeCalculations })}
    ORDER BY ${tableStep.columnIndex}`,
    [],
    DB.mergeProps()
  )
}
