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
  const tableCalculation = new TableCalculation(surveyId)

  return client.none(
    `UPDATE ${tableCalculation.nameQualified}
    SET ${TableCalculation.columnSet.script} = $2
    WHERE ${TableCalculation.columnSet.uuid} = $1`,
    [calculationUuid, script]
  )
}

/**
 * Update calculation indexes of a processing step according to the order of the calculation uuids passed as parameter.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.stepUuid - The processing step uuid.
 * @param {!Array.<string>} params.calculationUuids - The processing step calculation uuids.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Array.<null>>} - The result promise.
 */
export const updateCalculationIndexes = async (params, client = DB.client) => {
  const { surveyId, stepUuid, calculationUuids } = params
  const tableCalculation = new TableCalculation(surveyId)

  // shift all indexes first to avoid unique constraint violation
  await client.none(
    `UPDATE ${tableCalculation.nameQualified}
    SET ${TableCalculation.columnSet.index} = ${TableCalculation.columnSet.index} + $2
    WHERE ${TableCalculation.columnSet.stepUuid} = $1`,
    [stepUuid, calculationUuids.length]
  )

  return Promise.all(
    calculationUuids.map((calculationUuid, index) =>
      client.none(
        `UPDATE ${tableCalculation.nameQualified}
        SET ${TableCalculation.columnSet.index} = $2
        WHERE ${TableCalculation.columnSet.uuid} = $1`,
        [calculationUuid, index]
      )
    )
  )
}
