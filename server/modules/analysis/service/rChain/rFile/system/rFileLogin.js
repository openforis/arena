import RFileSystem from './rFileSystem'

export default class RFileLogin extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'login')
  }

  async init() {
    await super.init()

    await this.appendContent('if (!exists("arenaLogin")) arenaLogin=FALSE')
    await this.appendContent('if (arenaLogin==FALSE) arenaLogin = arena.login()')
  }
}
