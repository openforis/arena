import Job from '@server/job/job'

import { ChainNodeDefRepository } from '@server/modules/analysis/repository/chainNodeDef'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

/**
 * Inserts a chain for each chain in the zip file.
 * Saves the list of inserted chains in the "chains" context property.
 */
export default class ChainNodeDefsImportJob extends Job {
  constructor(params) {
    super('ChainNodeDefsImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId } = this.context

    const chainNodeDefs = await ArenaSurveyFileZip.getChainNodeDefs(arenaSurveyFileZip)
    await ChainNodeDefRepository.insertMany({ surveyId, chainNodeDefs }, this.tx)

    this.setContext({ chainNodeDefs })
  }
}
