import RFilePersistScriptsGeneric from './rFilePersistScriptsGeneric'

export default class RFilePersistUserScripts extends RFilePersistScriptsGeneric {
  constructor(rChain) {
    super(rChain, 'persist-user-scripts')
  }

  async appendPersistUserScripts() {
    const { dirNames } = this.rChain
    await this.appendSendToServerScripts({ dirName: dirNames.user, zipName: 'userScripts.zip' })
  }

  async appendPersistSamplingScripts() {
    const { dirNames } = this.rChain
    await this.appendSendToServerScripts({ dirName: dirNames.sampling, zipName: 'samplingScripts.zip' })
  }

  async appendPersistScripts() {
    // persist base unit scripts
    await this.appendPersistSamplingScripts()
    // persist user scripts
    await this.appendPersistUserScripts()
  }
}
