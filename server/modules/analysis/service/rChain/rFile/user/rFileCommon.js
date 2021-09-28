import * as Chain from '@common/analysis/chain'

import RFileUser from './rFileUser'

export default class RFileCommon extends RFileUser {
  constructor(rChain) {
    super(rChain, '000-common')
  }

  async init() {
    await super.init()

    const { chain } = this.rChain
    await this.appendContent(Chain.getScriptCommon(chain))
  }
}
