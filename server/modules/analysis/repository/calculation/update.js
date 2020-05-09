import * as DB from '../../../../db'

import { TableCalculation } from '../../../../../common/model/db'

/**
 * Updates the script of the given processing step calculation.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.calculationUuid - The processing step calculation uuid.
 * @param {!string} params.script - The script content.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<null>} - The result promise.
 */
export const updateCalculationScript = async (params, client = DB.client) => {
  const { surveyId, calculationUuid, script } = params
  const table = new TableCalculation(surveyId)

  return client.none(
    `UPDATE ${table.nameQualified}
    SET ${TableCalculation.columnSet.script} = $2
    WHERE ${TableCalculation.columnSet.uuid} = $1`,
    [calculationUuid, script]
  )
}
