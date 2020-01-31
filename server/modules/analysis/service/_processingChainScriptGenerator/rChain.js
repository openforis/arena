import Counter from '@core/counter'
import * as ProcessUtils from '@core/processUtils'

import * as ProcessingChain from '@common/analysis/processingChain'

import * as FileUtils from '@server/utils/file/fileUtils'
import { RFileSystem } from './rFile'

import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

const FILE_R_STUDIO_PROJECT = FileUtils.join(__dirname, 'chain', 'r_studio_project.Rproj')

class RChain {
  constructor(surveyId, cycle, chainUuid) {
    this._surveyId = surveyId
    this._cycle = cycle
    this._chainUuid = chainUuid
    this._chain = null

    this._dir = null
    this._dirUser = null
    this._dirSystem = null

    this._fileArena = null
    this._fileRStudioProject = null

    this._fileInit = null

    this._counter = new Counter()
  }

  get dirSystem() {
    return this._dirSystem
  }

  get dirUser() {
    return this._dirUser
  }

  get scriptIndexNext() {
    return this._counter.increment()
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

  async _initChain() {
    this._chain = await ProcessingChainManager.fetchChainByUuid(this._surveyId, this._chainUuid)
  }

  async init() {
    await this._initDirs()
    await this._initFiles()
    await this._initChain()
  }
}

export default RChain
