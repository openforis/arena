import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as AnalysisService from '@server/modules/analysis/service'
import * as FileUtils from '@server/utils/file/fileUtils'

export default class ChainExportJob extends Job {
  constructor(params) {
    super('ChainExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const chainsPathDir = 'chains'
    const chainsPathFile = FileUtils.join(chainsPathDir, 'chains.json')
    const chains = await AnalysisService.fetchChains({ surveyId })
    archive.append(JSON.stringify(chains, null, 2), { name: chainsPathFile })

    this.total = chains.length

    await PromiseUtils.each(chains, async (chain) => {
      const chainData = await AnalysisService.fetchChain({
        surveyId,
        chainUuid: chain.uuid,
        includeStepsAndCalculations: true,
        includeScript: true,
      })
      archive.append(JSON.stringify(chainData, null, 2), {
        name: FileUtils.join(chainsPathDir, `${chain.uuid}.json`),
      })
      this.incrementProcessedItems()
    })
  }
}
