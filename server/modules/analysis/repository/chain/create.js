import * as Chain from '../../../../../common/analysis/processingChain'
import { TableChain } from '../../../../../common/model/db'

import { db } from '../../../../db/db'
import { dbTransformCallback } from '../../../survey/repository/surveySchemaRepositoryUtils'

/**
 * Create a processing chain.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!object} params.chain - The processing chain.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Chain>} - The result promise.
 */
export const insertChain = (params, client = db) => {
  const { surveyId, chain } = params
  const tableChain = new TableChain(surveyId)

  return client.one(
    `INSERT INTO 
        ${tableChain.nameQualified}.processing_chain 
        (${TableChain.columnSet.uuid}, ${TableChain.columnSet.props}, ${TableChain.columnSet.validation})
    VALUES ($1, $2, $3)
    RETURNING *`,
    [Chain.getUuid(chain), Chain.getProps(chain), Chain.getValidation(chain)],
    dbTransformCallback
  )
}
