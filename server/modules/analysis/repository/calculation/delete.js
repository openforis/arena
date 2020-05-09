import * as DB from '../../../../db'

import * as Calculation from '../../../../../common/analysis/processingStepCalculation'
import { TableCalculation } from '../../../../../common/model/db'

/**
 * Delete a calculation.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.calculationUuid - The calculation uuid.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Calculation>} - The result promise.
 */
export const deleteCalculation = async (params, client = DB.client) => {
  const { surveyId, calculationUuid } = params
  const tableCalculation = new TableCalculation(surveyId)

  const calculation = await client.one(
    `DELETE FROM  
        ${tableCalculation.nameQualified}
    WHERE ${TableCalculation.columnSet.uuid} = $1
    RETURNING *`,
    [calculationUuid],
    DB.transformCallback
  )

  // Update indexes of next calculations
  await client.none(
    `UPDATE
        ${tableCalculation.nameQualified}
      SET ${TableCalculation.columnSet.index} = ${TableCalculation.columnSet.index} - 1
      WHERE ${TableCalculation.columnSet.stepUuid} = $1 AND ${TableCalculation.columnSet.index} > $2`,
    [Calculation.getProcessingStepUuid(calculation), Calculation.getIndex(calculation)]
  )

  return calculation
}
