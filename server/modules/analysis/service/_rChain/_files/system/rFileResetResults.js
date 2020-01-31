import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'

import * as NodeAnalysisTable from '@common/surveyRdb/nodeAnalysisTable'
import { dbSendQuery } from '@server/modules/analysis/service/_rChain/rFunctions'

export default class RFileResetResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'reset-results')
  }

  async init() {
    await super.init()

    const query = dbSendQuery(
      `delete from ${NodeAnalysisTable.tableName} where ${NodeAnalysisTable.colNames.processingChainUuid} = '${this.rChain.chainUuid}'`,
    )
    return await this.appendContent(query)
  }
}
