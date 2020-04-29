import { TableChain } from '../../../../../common/model/db'

import { db } from '../../../../db/db'

/**
 * Updates the fields passed as argument of a processing chain.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.chainUuid - The processing chain uuid.
 * @param {!object<string, any>} params.fields - A <key, value> object containing the fields to update.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<null>} - The result promise.
 */
export const updateChain = (params, client = db) => {
  const { surveyId, chainUuid, fields } = params
  const table = new TableChain(surveyId)

  return client.none(
    `UPDATE ${table.nameQualified}
    SET ${Object.keys(fields)
      .map((field, i) => `${field} = $${i + 2}`)
      .join(', ')}
    WHERE ${TableChain.columnSet.uuid} = $1`,
    [chainUuid, ...Object.values(fields)]
  )
}
