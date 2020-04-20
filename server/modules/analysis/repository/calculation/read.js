import * as pgPromise from 'pg-promise'
import * as R from 'ramda'

import { db } from '../../../../db/db'

import { TableCalculation } from '../../../../../common/model/db'

/**
 * Fetches the script associated to a processing step calculation.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.calculationUuid - The processing step calculation uuid.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchCalculationScript = async (params, client = db) => {
  const { surveyId, calculationUuid } = params
  const table = new TableCalculation(surveyId)
  return client.one(
    `
        SELECT ${table.columnScript} as script
        FROM ${table.nameFull}
        WHERE ${table.columnUuid} = $1
    `,
    [calculationUuid],
    R.prop('script')
  )
}
