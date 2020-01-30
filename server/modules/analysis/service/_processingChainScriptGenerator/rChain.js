import Counter from '@core/counter'
import * as ProcessUtils from '@core/processUtils'
import * as StringUtils from '@core/stringUtils'

import * as FileUtils from '@server/utils/file/fileUtils'

import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'
import RFile from './rFile'

const FILE_R_STUDIO_PROJECT = FileUtils.join(__dirname, 'chain', 'r_studio_project.Rproj')

class RChain {
  constructor(surveyId, chainUuid) {
    this._chainUuid = chainUuid
    this._surveyId = surveyId
    this._chain = null

    this._dir = null
    this._dirUser = null
    this._dirSystem = null

    this._fileArena = null
    this._fileRStudioProject = null

    this._fileSystemInit = null

    this._counter = new Counter()
  }

  _newFileName(name) {
    return `${StringUtils.padStart(3, '0')(this._counter.increment())}-${name}`
  }

  async _initDirs() {
    this._dir = FileUtils.join(ProcessUtils.ENV.analysisOutputDir, this._chainUuid)
    await FileUtils.rmdir(this._dir)
    await FileUtils.mkdir(this._dir)

    this._dirSystem = FileUtils.join(this._dir, 'system')
    this._dirUser = FileUtils.join(this._dir, 'user')
    await Promise.all([FileUtils.mkdir(this._dirSystem), FileUtils.mkdir(this._dirUser)])

    await this._initDirSystem()
  }

  async _initDirSystem() {
    this._fileSystemInit = new RFile(this, FileUtils.join(this._dirSystem, this._newFileName('init.R')))
    await this._fileSystemInit.init()
  }

  async _initFiles() {
    this._fileArena = FileUtils.join(this._dir, 'arena.R')
    this._fileRStudioProject = FileUtils.join(this._dir, 'r_studio_project.Rproj')

    await Promise.all([
      FileUtils.appendFile(this._fileArena),
      FileUtils.copyFile(FILE_R_STUDIO_PROJECT, this._fileRStudioProject),
    ])
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
