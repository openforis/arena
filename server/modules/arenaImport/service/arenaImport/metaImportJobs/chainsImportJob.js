import Job from '@server/job/job'
import * as AnalysisManager from '@server/modules/analysis/manager'

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

    await Promise.all(
      chains.map(async (chain) => AnalysisManager.importChain({ surveyId, chain, user: this.user }, this.tx))
    )

    this.setContext({ chains })
  }
}
