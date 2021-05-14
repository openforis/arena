import Job from '@server/job/job'
import * as AnalysisService from '@server/modules/analysis/service'
import { ExportFile } from '../exportFile'

export default class ChainNodeDefExportJob extends Job {
  constructor(params) {
    super('ChainNodeDefExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const chainNodeDefsPathFile = ExportFile.chainNodeDef
    const chainNodeDefs = await AnalysisService.getAllChainNodeDefs({ surveyId })
    archive.append(JSON.stringify(chainNodeDefs, null, 2), { name: chainNodeDefsPathFile })

    this.total = chainNodeDefs.length
  }
}
