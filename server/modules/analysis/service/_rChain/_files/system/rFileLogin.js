import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'

export default class RFileLogin extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'login')
  }

  async init() {
    await super.init()

    await this.appendContent('arena.login()')
  }
}
