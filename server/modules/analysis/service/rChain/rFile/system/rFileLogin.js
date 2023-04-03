import RFileSystem from './rFileSystem'

export default class RFileLogin extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'login')
  }

  async init() {
    await super.init()

    await this.appendContent(`
if (!exists("arenaLogin") || !arenaLogin) {
  arenaLogin = arena.login()
}
if (!arenaLogin) {
  stop("Login to Arena server is necessary to proceed.")
}
`)
  }
}
