import { db } from '@server/db/db'
import { dbTransformCallback } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import { TableStep } from '@common/model/db'

/**
 * Fetches processing steps by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {boolean} [params.includeCalculations=false] - Whether to include the calculations.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 * @param {!pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchSteps = (params, client = db) => client.map(TableStep.getSelect(params), [], dbTransformCallback)
