import DfResults from './dfResults'
import RFileSystem from './rFileSystem'

export default class RFileCalculateResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'calculate-results')
  }

  async generateChainEntitiesResults() {
    const { entitiesWithActiveQuantitativeVariables } = this.rChain

    for (const entity of entitiesWithActiveQuantitativeVariables) {
      const dfResults = new DfResults(this.rChain, entity)

      await this.logInfo(`'Generating results for entity ${dfResults.dfSourceName} started'`) // NOSONAR
      await this.appendContent(...dfResults.scripts) // NOSONAR
      await this.logInfo(`'Generating results for entity ${dfResults.dfSourceName} completed'`) // NOSONAR
    }
  }

  async init() {
    await super.init()

    await this.generateChainEntitiesResults()

    return this
  }
}
