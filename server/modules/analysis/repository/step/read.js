import { db } from '@server/db/db'
import { dbTransformCallback } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import { TableStep } from '@common/model/db'

/**
 * Fetches all processing steps by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {string} [params.chainUuid=null] - The chain uuid to filter for.
 * @param {string} [params.entityUuid=null] - The entity uuid to filter for.
 * @param {boolean} [params.includeCalculations=false] - Whether to include calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include calculations script.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchSteps = async (params, client = db) => {
  const { surveyId, chainUuid = null, entityUuid = null, includeScript = false, includeCalculations = false } = params

  const tableStep = new TableStep(surveyId)

  return client.map(
    `${tableStep.getSelect({ chainUuid, entityUuid, includeScript, includeCalculations })}
    ORDER BY ${tableStep.columnIndex}`,
    [],
    dbTransformCallback
  )
}
