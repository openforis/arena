import * as ApiRoutes from '@common/apiRoutes'

import RFileSystem from './rFileSystem'
import { arenaDelete } from '../../rFunctions'

export default class RFileResetResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'reset-results')
  }

  async init() {
    await super.init()

    const { surveyId, cycle, chainUuid } = this.rChain

    const resetResults = arenaDelete(ApiRoutes.rChain.getChainNodeResultsReset(surveyId, chainUuid), { cycle })
    await this.appendContent(resetResults)

    return this
  }
}
