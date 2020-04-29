import { db } from '../../../../db/db'

import * as ChainRepository from '../../repository/chain'

export { fetchChains, fetchChain, updateChain } from '../../repository/chain'

export const updateChainStatusExec = async ({ surveyId, chainUuid, statusExec }) => {
  return db.tx(async (tx) =>
    Promise.all([ChainRepository.updateChainStatusExec({ surveyId, chainUuid, statusExec }, tx)])
  )
}
