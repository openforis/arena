import * as PromiseUtils from '@core/promiseUtils'
import * as ApiRoutes from '@common/apiRoutes'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import RFileSystem from './rFileSystem'
import DfResults from './dfResults'

import { dirCreate, writeCsv, arenaPutFile, zipr, unlink } from '../../rFunctions'

const getPutResultsScripts = (rChain, dfResults) => {
  const { surveyId, cycle, dirResults } = rChain
  const { name: dfResultName, dfSourceName, step } = dfResults
  const scripts = []

  // csv file
  const fileResults = `${dirResults}/${dfSourceName}.csv`
  scripts.push(writeCsv(dfResultName, fileResults))
  // zip file
  const fileZip = `${dirResults}/${dfSourceName}.zip`
  scripts.push(zipr(fileZip, fileResults))
  // put request
  scripts.push(arenaPutFile(ApiRoutes.rChain.stepEntityData(surveyId, cycle, ProcessingStep.getUuid(step)), fileZip))

  return scripts
}

function* initPersistStepResults() {
  const { chain } = this.rChain
  const steps = ProcessingChain.getProcessingSteps(chain).filter(ProcessingStep.hasEntity)

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]
    const dfResults = new DfResults(this.rChain, step)

    yield this.logInfo(`'Uploading results for entity ${dfResults.dfSourceName} started'`)
    yield this.appendContent(...dfResults.scripts)
    yield this.appendContent(...getPutResultsScripts(this.rChain, dfResults))
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
    await this.appendContent(zipr(zipFile, dirNames.user))
    await this.appendContent(arenaPutFile(ApiRoutes.rChain.chainUserScripts(surveyId, chainUuid), zipFile))
    await this.logInfo(`'Persisting user scripts completed'`)
  }

  async init() {
    await super.init()
    const { dirResults } = this.rChain
    this.initPersistStepResults = initPersistStepResults.bind(this)

    // create results dir
    await this.appendContent(dirCreate(dirResults))
    // persist step results
    await PromiseUtils.resolveGenerator(this.initPersistStepResults())
    // persist user scripts
    await this.initPersistUserScripts()
    // remove results dir
    await this.appendContent(unlink(dirResults))

    return this
  }
}
