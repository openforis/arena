import * as Chain from '@common/analysis/chain'

import RFileUser from './rFileUser'

export default class RFileCommonEnd extends RFileUser {
  constructor(rChain) {
    super(rChain, '999-common-end')
  }

  async init() {
    await super.init()

    const { chain } = this.rChain
    await this.appendContent(Chain.getScriptEnd(chain))
  }
}
