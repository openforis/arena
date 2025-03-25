import * as DB from '../../../../db'

import { TableChain } from '../../../../../common/model/db'

/**
 * Updates the fields passed as argument of a processing chain.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.chainUuid - The processing chain uuid.
 * @param {{[key:string]: any}} [params.fields={}] - A <key, value> object containing the fields to update.
 * @param {boolean} [params.dateExecuted=false] - Whether to update date executed to current time.
 * @param {boolean} [params.dateModified=false] - Whether to update date modified to current time.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<null>} - The result promise.
 */
export const updateChain = async (params, client = DB.client) => {
  const { surveyId, chainUuid, fields = {}, dateExecuted = false, dateModified = false } = params

  if (!surveyId || !chainUuid)
    throw new Error(`Survey id and chain uuid are required. {surveyId:${surveyId}, chainUuid:${chainUuid}`)

  const table = new TableChain(surveyId)

  const setFields = Object.keys(fields).map((field, i) =>
    field === TableChain.columnSet.props
      ? `${TableChain.columnSet.props} = ${TableChain.columnSet.props} || $${i + 2}::jsonb`
      : `${field} = $${i + 2}`
  )
  if (dateExecuted) setFields.push(`${TableChain.columnSet.dateExecuted} = ${DB.now}`)
  if (dateModified) setFields.push(`${TableChain.columnSet.dateModified} = ${DB.now}`)

  if (setFields.length === 0) throw new Error(`At least one among fields, dateExecuted or dateModified is required`)

  return client.none(
    `UPDATE ${table.nameQualified}
    SET ${setFields.join(', ')}
    WHERE ${TableChain.columnSet.uuid} = $1`,
    [chainUuid, ...Object.values(fields)]
  )
}
