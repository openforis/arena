import Job, { type JobParams } from '@server/job/job'
import * as AnalysisService from '@server/modules/analysis/service'
import { ExportFile } from '../exportFile'

export default class ChainExportJob extends Job {
  constructor(params?: Partial<JobParams>) {
    super('ChainExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const chainsPathFile = ExportFile.chains
    const chains = await AnalysisService.fetchChains({ surveyId, includeScript: true })
    archive.append(JSON.stringify(chains, null, 2), { name: chainsPathFile })

    this.total = chains.length
  }
}
