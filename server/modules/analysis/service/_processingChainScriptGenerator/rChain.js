import Counter from '@core/counter'
import * as ProcessUtils from '@core/processUtils'
import * as ProcessingChain from '@common/analysis/processingChain'

import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

import { RFileSystem } from './rFile'
import RStep from './rStep'

const FILE_R_STUDIO_PROJECT = FileUtils.join(__dirname, 'chain', 'r_studio_project.Rproj')

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
    this._filePersistResults = null
    this._filePersistScripts = null
    this._fileClose = null

    this._counter = new Counter()
  }

  get survey() {
    return this._survey
  }

  get chain() {
    return this._chain
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
    this._survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this._surveyId, this._cycle)
    this._chain = await ProcessingChainManager.fetchChainByUuid(this._surveyId, this._chainUuid)
    const steps = await ProcessingChainManager.fetchStepsByChainUuid(this._surveyId, this._chainUuid)
    this._chain = ProcessingChain.assocProcessingSteps(steps)(this._chain)
  }

  async _initDirs() {
    // Init dirs
    this._dir = FileUtils.join(ProcessUtils.ENV.analysisOutputDir, this._chainUuid)
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
    this._fileInit = new RFileSystem(this, 'init')
    await this._fileInit.init()

    this._fileResetResults = new RFileSystem(this, 'reset-results')
    await this._fileResetResults.init()
  }

  async _initSteps() {
    for (const step of ProcessingChain.getProcessingSteps(this._chain)) {
      const rStep = new RStep(this._surveyId, this, step)
      await rStep.init()
    }
  }

  async _initFilesClosing() {
    this._filePersistResults = new RFileSystem(this, 'persist-results')
    await this._filePersistResults.init()

    this._filePersistScripts = new RFileSystem(this, 'persist-scripts')
    await this._filePersistScripts.init()

    this._fileClose = new RFileSystem(this, 'close')
    await this._fileClose.init()
  }

  async init() {
    await this._initSurveyAndChain()
    await this._initDirs()
    await this._initFiles()
    await this._initSteps()
    await this._initFilesClosing()
  }
}

export default RChain
