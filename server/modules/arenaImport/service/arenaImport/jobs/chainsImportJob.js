import Job from '@server/job/job'

import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as ChainManager from '@server/modules/analysis/manager'
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

    if (chains.length > 0) {
      await ChainRepository.insertMany({ surveyId, chains }, this.tx)
      // imported backups can contain chains exported by older Arena versions, with sampling design
      // props stored under the old key names: the imported survey is stamped with the current app
      // version (i.e. "already migrated"), so migrate the just inserted chains here.
      // Idempotent and a no-op for chains without old keys.
      await ChainManager.migrateSamplingDesignPhaseProps({ surveyId }, this.tx)
    }

    this.setContext({ chains })
  }
}
