import { DB, BaseProtocol } from '@openforis/arena-server'

import * as Chain from '../../../../../common/analysis/processingChain'
import { TableChain } from '../../../../../common/model/db'
import { transformCallback } from './read'

/**
 * Create a processing chain.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!object} params.chain - The processing chain.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<Chain>} - The result promise.
 */
export const insertChain = async (params, client = DB) => {
  const { surveyId, chain } = params
  const tableChain = new TableChain(surveyId)

  return client.one(
    `INSERT INTO 
        ${tableChain.nameQualified} 
        (${TableChain.columnSet.uuid}, ${TableChain.columnSet.props}, ${TableChain.columnSet.validation})
    VALUES ($1, $2, $3)
    RETURNING *`,
    [Chain.getUuid(chain), Chain.getProps(chain), Chain.getValidation(chain)],
    transformCallback
  )
}
