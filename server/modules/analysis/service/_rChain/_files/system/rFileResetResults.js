import * as NodeAnalysisTable from '@common/surveyRdb/nodeAnalysisTable'

import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'
import { dbSendQuery } from '@server/modules/analysis/service/_rChain/rFunctions'

export default class RFileResetResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'reset-results')
  }

  async init() {
    await super.init()

    const chainUuid = this.rChain.chainUuid
    const query = dbSendQuery(
      `delete from ${NodeAnalysisTable.tableName} where ${NodeAnalysisTable.colNames.processingChainUuid} = '${chainUuid}'`,
    )
    return await this.appendContent(query)
  }
}
