import * as ApiRoutes from '@common/apiRoutes'
import * as FileUtils from '@server/utils/file/fileUtils'

import RFileSystem from './rFileSystem'

import { arenaPutFile, dirCreate, unlink, zipr } from '../../rFunctions'

/**
 * Abstract class to be extended by subclasses.
 */
export default class RFilePersistScriptsGeneric extends RFileSystem {
  async appendSendToServerScripts({ dirName, zipName }) {
    const { surveyId, chainUuid, dirResults } = this.rChain
    const zipFile = FileUtils.join(dirResults, zipName)

    await this.logInfo(`'Persisting ${zipName} started'`)
    await this.appendContent(
      zipr(zipFile, dirName),
      arenaPutFile(ApiRoutes.rChain.chainUserScripts(surveyId, chainUuid), zipFile)
    )
    await this.logInfo(`'Persisting ${zipName} completed'`)
  }

  async appendPersistScripts() {
    // to be extended by subclasses
  }

  getHeaderScript() {
    return `if (checkGlobalErrors("${this.fileName} cannot be executed.")) {`
  }

  getFooterScript() {
    return `}`
  }

  async init(commentedOut = false) {
    await super.init(commentedOut)
    const { dirResults } = this.rChain

    // check errors script
    await this.appendContent(this.getHeaderScript())
    // create results dir
    await this.appendContent(dirCreate(dirResults))
    // generate persist scripts
    await this.appendPersistScripts()
    // remove results dir
    await this.appendContent(unlink(dirResults))

    await this.appendContent(this.getFooterScript())

    return this
  }
}
