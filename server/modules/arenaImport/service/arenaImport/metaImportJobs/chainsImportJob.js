import Job from '@server/job/job'

import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

/**
 * Inserts a chain for each chain in the zip file.
 * Saves the list of inserted chains in the "chains" context property.
 */
export default class ChainsImportJob extends Job {
  constructor(params) {
    super('ChainsImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId } = this.context

    const chains = await ArenaSurveyFileZip.getChains(arenaSurveyFileZip)

    await ChainRepository.insertMany({ surveyId, chains }, this.tx)

    this.setContext({ chains })
  }
}
