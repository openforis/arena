import type { ArenaChain } from '@openforis/arena-core'
import { DB } from '@openforis/arena-server'

import * as Chain from '@common/analysis/chain'
import type { DbClient } from '@server/db/db'
import { TableChain } from '../../../../../common/model/db'

import { transformCallback } from './read'

/**
 * Create a processing chain.
 * @param {!object} params - The query parameters.
 * @param {!object} params.chain - The processing chain.
 */
type ChainToInsert = Omit<ArenaChain, 'validation'> & { validation?: ArenaChain['validation'] }

export const insertChain = (params: { surveyId: number; chain: ArenaChain }, client: DbClient = DB) => {
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
 * @param {!object} params.chain - The processing chain.
 * @param {string|null} [params.scriptCommon] - The common R script.
 * @param {string|null} [params.scriptEnd] - The end R script.
 */
export const insertChainFull = (
  params: {
    surveyId: number
    // a cloned chain has no validation yet
    chain: ChainToInsert
    scriptCommon?: string | null
    scriptEnd?: string | null
  },
  client: DbClient = DB
) => {
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
