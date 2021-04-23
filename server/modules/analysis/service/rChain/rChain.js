import Counter from '@core/counter'
import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import * as PromiseUtils from '@core/promiseUtils'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as AnalysisManager from '../../manager'

import RStep from './rStep'
import { ListCategories, RFileClose, RFileInit, RFileLogin, RFilePersistResults, RFileReadData } from './rFile/system'
import { RFileCommon } from './rFile/user'

const FILE_R_STUDIO_PROJECT = FileUtils.join(__dirname, 'rFile', 'r_studio_project.Rproj')

class RChain {
  constructor(surveyId, cycle, chainUuid, serverUrl) {
    this._surveyId = surveyId
    this._survey = null
    this._cycle = cycle
    this._chainUuid = chainUuid
    this._chain = null
    this._serverUrl = serverUrl

    this._dirNames = RChain.dirNames
    this._dir = null
    this._dirUser = null
    this._dirSystem = null
    this._dirResults = null

    // Root files
    this._fileArena = null
    this._fileRStudioProject = null
    // System files
    this._fileInit = null
    this._fileLogin = null
    this._fileReadData = null
    this._filePersistResults = null
    this._fileClose = null
    // User files
    this._fileCommon = null

    // Categories
    this._listCategories = null

    this._counter = new Counter()
    this._rSteps = []
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

  get serverUrl() {
    return this._serverUrl
  }

  get rSteps() {
    return this._rSteps
  }

  get cycle() {
    return this._cycle
  }

  get dirNames() {
    return this._dirNames
  }

  get dir() {
    return this._dir
  }

  get dirSystem() {
    return this._dirSystem
  }

  get dirUser() {
    return this._dirUser
  }

  get dirResults() {
    return this._dirResults
  }

  get fileArena() {
    return this._fileArena
  }

  get scriptIndexNext() {
    return this._counter.increment()
  }

  get listCategories() {
    return this._listCategories
  }

  async _initSurveyAndChain() {
    this._survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId: this.surveyId, cycle: this.cycle })
    const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId({ surveyId: this.surveyId })
    this._survey = Survey.assocCategories(categories)(this.survey)
    this._chain = await AnalysisManager.fetchChain({
      surveyId: this.surveyId,
      chainUuid: this.chainUuid,
      includeScript: true,
      includeStepsAndCalculations: true,
    })
    this._listCategories = new ListCategories(this)
  }

  async _initDirs() {
    // Init dirs
    const surveyInfo = Survey.getSurveyInfo(this.survey)
    const surveyName = Survey.getName(surveyInfo)
    const chainLabel = ProcessingChain.getLabel(Survey.getDefaultLanguage(surveyInfo))(this.chain)
    this._dir = FileUtils.join(ProcessUtils.ENV.analysisOutputDir, surveyName, chainLabel)
    await FileUtils.rmdir(this._dir)
    await FileUtils.mkdir(this._dir)

    this._dirSystem = FileUtils.join(this._dir, this.dirNames.system)
    this._dirUser = FileUtils.join(this._dir, this.dirNames.user)
    this._dirResults = FileUtils.join(this.dirNames.system, 'results')
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
    this._fileLogin = await new RFileLogin(this).init()
    this._fileReadData = await new RFileReadData(this).init()

    // Init user files
    this._fileCommon = await new RFileCommon(this).init()
  }

  async _initSteps() {
    const steps = ProcessingChain.getProcessingSteps(this._chain)
    await PromiseUtils.each(steps, async (step) => {
      const rStep = await new RStep(this._surveyId, this, step).init()
      this._rSteps.push(rStep)
    })
  }

  async _initFilesClosing() {
    this._filePersistResults = await new RFilePersistResults(this).init()
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

RChain.dirNames = { user: 'user', system: 'system' }

export default RChain
