import * as Chain from '@common/analysis/processingChain'

import Job from '@server/job/job'
import * as AnalysisManager from '@server/modules/analysis/manager'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

const insertChain = async ({ chainUuid, user, surveyId, arenaSurveyFileZip }, client) => {
  const chain = await ArenaSurveyFileZip.getChain(arenaSurveyFileZip, chainUuid)
  await AnalysisManager.importChain({ surveyId, chain, user }, client)
}

/**
 * Inserts a taxonomy for each taxonomy
 * Saves the list of inserted taxonomies in the "taxonomies" context property.
 */
export default class ChainsImportJob extends Job {
  constructor(params) {
    super('ChainsImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId } = this.context

    const chains = await ArenaSurveyFileZip.getChains(arenaSurveyFileZip)

    await Promise.all(
      chains.map(async (chain) =>
        insertChain({ chainUuid: Chain.getUuid(chain), user: this.user, surveyId, arenaSurveyFileZip }, this.tx)
      )
    )

    this.setContext({ chains })
  }
}
