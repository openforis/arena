import { DB, BaseProtocol } from '@openforis/arena-server'

import * as Chain from '@common/analysis/chain'
import { TableChain } from '../../../../../common/model/db'
import { transformCallback } from './read'

/**
 * Create a processing chain.
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!object} params.chain - The processing chain.
 * @param {BaseProtocol} [client] - The database client.
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

/**
 * Create a processing chain including R scripts.
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!object} params.chain - The processing chain.
 * @param {string|null} [params.scriptCommon] - The common R script.
 * @param {string|null} [params.scriptEnd] - The end R script.
 * @param {BaseProtocol} [client] - The database client.
 * @returns {Promise<Chain>} - The result promise.
 */
export const insertChainFull = async (params, client = DB) => {
  const { surveyId, chain, scriptCommon = null, scriptEnd = null } = params
  const tableChain = new TableChain(surveyId)

  return client.one(
    `INSERT INTO
        ${tableChain.nameQualified}
        (${TableChain.columnSet.uuid}, ${TableChain.columnSet.props}, ${TableChain.columnSet.validation},
         ${TableChain.columnSet.scriptCommon}, ${TableChain.columnSet.scriptEnd})
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [Chain.getUuid(chain), Chain.getProps(chain), Chain.getValidation(chain), scriptCommon, scriptEnd],
    transformCallback
  )
}
