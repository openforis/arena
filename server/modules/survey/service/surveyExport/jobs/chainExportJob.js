import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as AnalysisService from '@server/modules/analysis/service'
import { ExportFile } from '../exportFile'

export default class ChainExportJob extends Job {
  constructor(params) {
    super('ChainExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const chainsPathFile = ExportFile.chains
    const chains = await AnalysisService.fetchChains({ surveyId })
    archive.append(JSON.stringify(chains, null, 2), { name: chainsPathFile })

    this.total = chains.length

    await PromiseUtils.each(chains, async (chain) => {
      const chainUuid = chain.uuid
      const chainData = await AnalysisService.fetchChain({
        surveyId,
        chainUuid,
        includeStepsAndCalculations: true,
        includeScript: true,
      })
      archive.append(JSON.stringify(chainData, null, 2), {
        name: ExportFile.chain({ chainUuid }),
      })
      this.incrementProcessedItems()
    })
  }
}
