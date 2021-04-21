import Job from '@server/job/job'
import * as AnalysisService from '@server/modules/analysis/service'
import * as FileUtils from '@server/utils/file/fileUtils'

export default class ChainBackupJob extends Job {
  constructor(params) {
    super('ChainBackupJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const chainsPathDir = 'chains'
    const chainsPathFile = FileUtils.join(chainsPathDir, 'chains.json')
    const chains = await AnalysisService.fetchChains({ surveyId })
    archive.append(JSON.stringify(chains, null, 2), { name: chainsPathFile })

    await Promise.all(
      chains.map(async (chain) => {
        const chainData = await AnalysisService.fetchChain({
          surveyId,
          chainUuid: chain.uuid,
          includeStepsAndCalculations: true,
          includeScript: true,
        })
        archive.append(JSON.stringify(chainData, null, 2), {
          name: FileUtils.join(chainsPathDir, `${chain.uuid}.json`),
        })
      })
    )
  }
}
