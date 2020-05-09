import * as DB from '../../../../db'

import { TableStep } from '../../../../../common/model/db'

/**
 * Updates the fields passed as argument of a processing step.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.stepUuid - The processing step uuid.
 * @param {object<string, any>} [params.fields={}] - A <key, value> object containing the fields to update.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<null>} - The result promise.
 */
export const updateStep = (params, client = DB.client) => {
  const { surveyId, stepUuid, fields = {} } = params

  if (!surveyId || !stepUuid)
    throw new Error(`Survey id and step uuid are required. {surveyId:${surveyId}, stepUuid:${stepUuid}`)

  const tableStep = new TableStep(surveyId)

  const setFields = Object.keys(fields).map((field, i) =>
    field === TableStep.columnSet.props
      ? `${TableStep.columnSet.props} = ${TableStep.columnSet.props} || $${i + 2}::jsonb`
      : `${field} = $${i + 2}`
  )

  if (setFields.length === 0) throw new Error(`At least one field is required`)

  return client.none(
    `UPDATE ${tableStep.nameQualified}
    SET ${setFields.join(', ')}
    WHERE ${TableStep.columnSet.uuid} = $1`,
    [stepUuid, ...Object.values(fields)]
  )
}
