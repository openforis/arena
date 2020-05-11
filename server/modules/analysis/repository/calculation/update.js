import * as DB from '../../../../db'

import { TableCalculation } from '../../../../../common/model/db'

/**
 * Updates the calculation fields passed as argument.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.calculationUuid - The calculation uuid.
 * @param {object<string, any>} [params.fields={}] - A <key, value> object containing the fields to update.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Calculation>} - The result promise.
 */
export const updateCalculation = (params, client = DB.client) => {
  const { surveyId, calculationUuid, fields = {} } = params

  if (!surveyId || !calculationUuid)
    throw new Error(
      `Survey id and calculation uuid are required. {surveyId:${surveyId}, calculationUuid:${calculationUuid}`
    )

  const tableCalculation = new TableCalculation(surveyId)

  const setFields = Object.keys(fields).map((field, i) =>
    field === TableCalculation.columnSet.props
      ? `${TableCalculation.columnSet.props} = ${TableCalculation.columnSet.props} || $${i + 2}::jsonb`
      : `${field} = $${i + 2}`
  )

  if (setFields.length === 0) throw new Error(`At least one field is required`)

  return client.one(
    `UPDATE ${tableCalculation.nameQualified}
    SET ${setFields.join(', ')}
    WHERE ${TableCalculation.columnSet.uuid} = $1
    RETURNING *`,
    [calculationUuid, ...Object.values(fields)]
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
