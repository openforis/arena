import { db } from '@server/db/db'
import { dbTransformCallback } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as DB from '@common/model/db'

const { TableCalculation } = DB.tables

/**
 * Fetches calculations by the given survey id.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {boolean} [params.includeScript=false] - Whether to include the R script.
 * @param {!pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchCalculations = ({ surveyId, includeScript }, client = db) =>
  client.map(TableCalculation.getSelect({ surveyId, includeScript }), [], dbTransformCallback)
