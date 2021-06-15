import * as PromiseUtils from '@core/promiseUtils'
import * as ApiRoutes from '@common/apiRoutes'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as NodeDef from '@core/survey/nodeDef'

import RFileSystem from './rFileSystem'
import DfResults from './dfResults'

import { dirCreate, writeCsv, arenaPutFile, zipr, unlink } from '../../rFunctions'

const getPutResultsScripts = ({ rChain, entity, dfResults }) => {
  const { chainUuid, surveyId, cycle, dirResults } = rChain
  const { name: dfResultName, dfSourceName } = dfResults
  const scripts = []

  // csv file
  const fileResults = `${dirResults}/${dfSourceName}.csv`
  scripts.push(writeCsv(dfResultName, fileResults))
  // zip file
  const fileZip = `${dirResults}/${dfSourceName}.zip`
  scripts.push(zipr(fileZip, fileResults))
  // put request
  scripts.push(arenaPutFile(ApiRoutes.rChain.entityData(surveyId, cycle, chainUuid, NodeDef.getUuid(entity)), fileZip))

  return scripts
}

function* initPersistChainEntitiesResults() {
  const { entitiesWithChainNodeDef } = this.rChain

  for (let i = 0; i < entitiesWithChainNodeDef.length; i += 1) {
    const entity = entitiesWithChainNodeDef[i]
    // TODO FIX to persist changes on scripts
    const dfResults = new DfResults(this.rChain, entity)

    yield this.logInfo(`'Uploading results for entity ${dfResults.dfSourceName} started'`)
    yield this.appendContent(...dfResults.scripts)
    yield this.appendContent(...getPutResultsScripts({ rChain: this.rChain, entity, dfResults }))
    yield this.logInfo(`'Uploading results for entity ${dfResults.dfSourceName} completed'`)
  }
}

export default class RFilePersistResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'persist-results')
  }

  async initPersistUserScripts() {
    const { surveyId, chainUuid, dirResults, dirNames } = this.rChain
    const zipFile = FileUtils.join(dirResults, 'userScripts.zip')

    await this.logInfo(`'Persisting user scripts started'`)
    await this.appendContent(
      zipr(zipFile, dirNames.user),
      arenaPutFile(ApiRoutes.rChain.chainUserScripts(surveyId, chainUuid), zipFile)
    )
    await this.logInfo(`'Persisting user scripts completed'`)
  }

  async init() {
    await super.init()
    const { dirResults } = this.rChain
    this.initPersistChainEntitiesResults = initPersistChainEntitiesResults.bind(this)

    // create results dir
    await this.appendContent(dirCreate(dirResults))
    // persist chainEntitiesResults
    await PromiseUtils.resolveGenerator(this.initPersistChainEntitiesResults())
    // persist user scripts
    await this.initPersistUserScripts()
    // remove results dir
    await this.appendContent(unlink(dirResults))

    return this
  }
}
