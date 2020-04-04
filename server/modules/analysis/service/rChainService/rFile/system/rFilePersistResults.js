import * as PromiseUtils from '@core/promiseUtils'
import * as ApiRoutes from '@common/apiRoutes'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import RFileSystem from './rFileSystem'
import DfResults from './dfResults'

import { dirCreate, writeCsv, arenaPutFile, zipr, unlink } from '../../rFunctions'

const getPutResultsScripts = (dfResults) => {
  const { name: dfResultName, dfSourceName, stepUuid, dirResults, surveyId } = dfResults
  const scripts = []

  // csv file
  const fileResults = `${dirResults}/${dfSourceName}.csv`
  scripts.push(writeCsv(dfResultName, fileResults))
  // zip file
  const fileZip = `${dirResults}/${dfSourceName}.zip`
  scripts.push(zipr(fileZip, fileResults))
  // put request
  scripts.push(arenaPutFile(ApiRoutes.rChain.stepEntityData(surveyId, stepUuid), fileZip))

  return scripts
}

function* initScript() {
  const { chain, dirResults } = this.rChain
  const steps = ProcessingChain.getProcessingSteps(chain).filter(ProcessingStep.hasEntity)

  // create results dir
  yield this.appendContent(dirCreate(dirResults))

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]
    const dfResults = new DfResults(this.rChain, step)

    yield this.logInfo(`'Uploading results for entity ${dfResults.dfSourceName} started'`)
    yield this.appendContent(...dfResults.scripts)
    yield this.appendContent(...getPutResultsScripts(dfResults))
    yield this.logInfo(`'Uploading results for entity ${dfResults.dfSourceName} completed'`)
  }

  // remove results dir
  yield this.appendContent(unlink(dirResults))
}

export default class RFilePersistResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'persist-results')
  }

  async init() {
    await super.init()
    this.initScript = initScript.bind(this)

    await PromiseUtils.resolveGenerator(this.initScript())

    return this
  }
}
