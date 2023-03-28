import * as PromiseUtils from '@core/promiseUtils'

import RFileSystem from './rFileSystem'
import DfResults from './dfResults'

export default class RFileCalculateResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'calculate-results')
  }

  async generateChainEntitiesResults() {
    const { entitiesWithActiveQuantitativeVariables } = this.rChain

    await PromiseUtils.each(entitiesWithActiveQuantitativeVariables, async (entity) => {
      const dfResults = new DfResults(this.rChain, entity)

      await this.logInfo(`'Generating results for entity ${dfResults.dfSourceName} started'`)
      await this.appendContent(...dfResults.scripts)
      await this.logInfo(`'Generating results for entity ${dfResults.dfSourceName} completed'`)
    })
  }

  async init() {
    await super.init()

    await this.generateChainEntitiesResults()

    return this
  }
}
