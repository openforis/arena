import * as ProcessingChain from '@common/analysis/processingChain'

import RFileUser from './rFileUser'

export default class RFileCommon extends RFileUser {
  constructor(rChain) {
    super(rChain, 'common')
  }

  async init() {
    await super.init()

    const { chain } = this.rChain
    await this.appendContent(ProcessingChain.getScriptCommon(chain))
  }
}
