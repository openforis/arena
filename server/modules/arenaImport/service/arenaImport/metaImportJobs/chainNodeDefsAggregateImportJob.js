import Job from '@server/job/job'

import { ChainNodeDefAggregateRepository } from '@server/modules/analysis/repository/chainNodeDefAggregate'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

/**
 * Inserts a chain for each chain in the zip file.
 * Saves the list of inserted chains in the "chains" context property.
 */
export default class ChainNodeDefsAggregateImportJob extends Job {
  constructor(params) {
    super('ChainNodeDefsAggregateImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId } = this.context

    const chainNodeDefsAggregate = await ArenaSurveyFileZip.getChainNodeDefsAggregate(arenaSurveyFileZip)

    await ChainNodeDefAggregateRepository.insertMany({ surveyId, chainNodeDefsAggregate }, this.tx)

    this.setContext({ chainNodeDefsAggregate })
  }
}
