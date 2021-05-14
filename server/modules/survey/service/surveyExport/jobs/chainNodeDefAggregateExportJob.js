import Job from '@server/job/job'
import * as AnalysisService from '@server/modules/analysis/service'
import { ExportFile } from '../exportFile'

export default class ChainNodeDefAggregateExportJob extends Job {
  constructor(params) {
    super('ChainNodeDefAggregateExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const chainNodeDefsAggregatePathFile = ExportFile.chainNodeDefAggregate
    const chainNodeDefsAggregate = await AnalysisService.getAllChainNodeDefsAggregate({ surveyId })
    archive.append(JSON.stringify(chainNodeDefsAggregate, null, 2), { name: chainNodeDefsAggregatePathFile })

    this.total = chainNodeDefsAggregate.length
  }
}
