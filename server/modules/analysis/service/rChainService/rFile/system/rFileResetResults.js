import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'

import RFileSystem from './rFileSystem'
import { dbSendQuery } from '../../rFunctions'

export default class RFileResetResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'reset-results')
  }

  async init() {
    await super.init()

    const { chainUuid } = this.rChain
    const query = dbSendQuery(
      `delete from ${ResultNodeTable.tableName} where ${ResultNodeTable.colNames.processingChainUuid} = '${chainUuid}'`
    )
    await this.appendContent(query)

    return this
  }
}
