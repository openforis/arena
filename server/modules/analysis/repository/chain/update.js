import { TableChain } from '../../../../../common/model/db'

import { db } from '../../../../db/db'

/**
 * Updates the common script of the given processing chain.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.chainUuid - The processing chain uuid.
 * @param {!string} params.scriptCommon - The script content.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<null>} - The result promise.
 */
export const updateChainScriptCommon = (params, client = db) => {
  const { surveyId, chainUuid, scriptCommon } = params
  const table = new TableChain(surveyId)

  return client.none(
    `UPDATE ${table.nameQualified}
    SET ${TableChain.columnSet.scriptCommon} = $2
    WHERE ${TableChain.columnSet.uuid} = $1`,
    [chainUuid, scriptCommon]
  )
}
