import { db } from '@server/db/db'
import { dbTransformCallback, getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import tableCalculation from './table'

export const getSelectCalculations = ({ surveyId, includeScript }) => {
  const cols = includeScript ? tableCalculation.columns : tableCalculation.columnsNoScript
  const selectFields = cols.map((col) => tableCalculation.addAlias(col)).join(', ')

  return `SELECT ${selectFields}
    FROM ${getSurveyDBSchema(surveyId)}.${tableCalculation.name} AS ${tableCalculation.alias}`
}

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
export const fetchCalculations = (params, client = db) =>
  client.map(getSelectCalculations(params), [], dbTransformCallback)
