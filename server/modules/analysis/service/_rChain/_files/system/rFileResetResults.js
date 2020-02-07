import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'

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
      `delete from ${ResultNodeTable.tableName} where ${ResultNodeTable.colNames.processingChainUuid} = '${chainUuid}'`,
    )
    return await this.appendContent(query)
  }
}
