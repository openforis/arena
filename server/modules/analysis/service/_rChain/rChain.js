import Counter from '@core/counter'
import * as ProcessUtils from '@core/processUtils'
import * as ProcessingChain from '@common/analysis/processingChain'

import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

import RStep from './rStep'
import { RFileSystem } from './rFile'
import RFileInit from './_files/system/rFileInit'
import RFileResetResults from './_files/system/rFileResetResults'
import RFileReadData from './_files/system/rFileReadData'
import RFileClose from './_files/system/rFileClose'

const FILE_R_STUDIO_PROJECT = FileUtils.join(__dirname, '_files', 'r_studio_project.Rproj')

class RChain {
  constructor(surveyId, cycle, chainUuid) {
    this._surveyId = surveyId
    this._survey = null
    this._cycle = cycle
    this._chainUuid = chainUuid
    this._chain = null

    this._dir = null
    this._dirUser = null
    this._dirSystem = null

    // Root files
    this._fileArena = null
    this._fileRStudioProject = null
    // System files
    this._fileInit = null
    this._fileResetResults = null
    this._fileReadData = null
    this._filePersistResults = null
    this._filePersistScripts = null
    this._fileClose = null
    // User files
    this._fileCommon = null

    this._counter = new Counter()
  }

  get surveyId() {
    return this._surveyId
  }

  get survey() {
    return this._survey
  }

  get chainUuid() {
    return this._chainUuid
  }

  get chain() {
    return this._chain
  }

  get cycle() {
    return this._cycle
  }

  get dirSystem() {
    return this._dirSystem
  }

  get dirUser() {
    return this._dirUser
  }

  get fileArena() {
    return this._fileArena
  }

  get scriptIndexNext() {
    return this._counter.increment()
  }

  async _initSurveyAndChain() {
    this._survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, this.cycle)
    this._chain = await ProcessingChainManager.fetchChainByUuid(this.surveyId, this.chainUuid)
    const steps = await ProcessingChainManager.fetchStepsAndCalculationsByChainUuid(this.surveyId, this.chainUuid)
    this._chain = ProcessingChain.assocProcessingSteps(steps)(this._chain)
  }

  async _initDirs() {
    // Init dirs
    this._dir = FileUtils.join(ProcessUtils.ENV.analysisOutputDir, this.chainUuid)
    await FileUtils.rmdir(this._dir)
    await FileUtils.mkdir(this._dir)

    this._dirSystem = FileUtils.join(this._dir, 'system')
    this._dirUser = FileUtils.join(this._dir, 'user')
    await Promise.all([FileUtils.mkdir(this._dirSystem), FileUtils.mkdir(this._dirUser)])
  }

  async _initFiles() {
    // Init root files
    this._fileArena = FileUtils.join(this._dir, 'arena.R')
    this._fileRStudioProject = FileUtils.join(this._dir, 'r_studio_project.Rproj')

    await Promise.all([
      FileUtils.appendFile(this._fileArena),
      FileUtils.copyFile(FILE_R_STUDIO_PROJECT, this._fileRStudioProject),
    ])

    // Init system files
    this._fileInit = await new RFileInit(this).init()
    this._fileResetResults = await new RFileResetResults(this).init()
    this._fileReadData = await new RFileReadData(this).init()

    // Init user files
    this._fileCommon = await new RFileSystem(this, 'common').init()
  }

  async _initSteps() {
    for (const step of ProcessingChain.getProcessingSteps(this._chain)) {
      await new RStep(this._surveyId, this, step).init()
    }
  }

  async _initFilesClosing() {
    this._filePersistResults = await new RFileSystem(this, 'persist-results').init()
    this._filePersistScripts = await new RFileSystem(this, 'persist-scripts').init()
    this._fileClose = await new RFileClose(this).init()
  }

  async init() {
    await this._initSurveyAndChain()
    await this._initDirs()
    await this._initFiles()
    await this._initSteps()
    await this._initFilesClosing()

    return this
  }
}

export default RChain
