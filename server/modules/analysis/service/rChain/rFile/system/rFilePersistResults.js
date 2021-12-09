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
  scripts.push(
    arenaPutFile(
      ApiRoutes.rChain.entityData({ surveyId, cycle, chainUuid, entityUuid: NodeDef.getUuid(entity) }),
      fileZip
    )
  )

  return scripts
}

function* initPersistChainEntitiesResults() {
  const { entities } = this.rChain

  for (let i = 0; i < entities.length; i += 1) {
    const entity = entities[i]
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

  async initPersistScripts({ dirName, zipName }) {
    const { surveyId, chainUuid, dirResults } = this.rChain
    const zipFile = FileUtils.join(dirResults, zipName)

    await this.logInfo(`'Persisting ${zipName} started'`)
    await this.appendContent(
      zipr(zipFile, dirName),
      arenaPutFile(ApiRoutes.rChain.chainUserScripts(surveyId, chainUuid), zipFile)
    )
    await this.logInfo(`'Persisting ${zipName} completed'`)
  }

  async initPersistUserScripts() {
    const { dirNames } = this.rChain
    await this.initPersistScripts({ dirName: dirNames.user, zipName: 'userScripts.zip' })
  }

  async initPersistSamplingScripts() {
    const { dirNames } = this.rChain
    await this.initPersistScripts({ dirName: dirNames.sampling, zipName: 'samplingScripts.zip' })
  }

  async init() {
    await super.init()
    const { dirResults } = this.rChain
    this.initPersistChainEntitiesResults = initPersistChainEntitiesResults.bind(this)

    // create results dir
    await this.appendContent(dirCreate(dirResults))
    // persist chainEntitiesResults
    await PromiseUtils.resolveGenerator(this.initPersistChainEntitiesResults())
    // persist base unit scripts
    await this.initPersistSamplingScripts()
    // persist user scripts
    await this.initPersistUserScripts()
    // remove results dir
    await this.appendContent(unlink(dirResults))

    return this
  }
}
