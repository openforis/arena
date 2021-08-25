import Counter from '@core/counter'
import * as ProcessUtils from '@core/processUtils'
import * as PromiseUtils from '@core/promiseUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/chain'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import * as AnalysisManager from '../../manager'
import * as StringUtils from '../../../../../core/stringUtils'

import { ListCategories, ListTaxonomies, RFileClose, RFileInit, RFileLogin, RFilePersistResults, RFileReadData } from './rFile/system'
import { RFileCommon } from './rFile/user'
import RFile, { padStart } from './rFile'

import { dfVar, NA, setVar } from './rFunctions'

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

    // Taxonomies
    this._listTaxonomies = null

    this._counter = new Counter()

    this._entities = []
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

  get listTaxonomies() {
    return this._listTaxonomies
  }

  get entities() {
    return this._entities
  }

  get entitiesWithAnalysisNodeDefs() {
    return this._entities.filter(
      (entity) => Survey.getAnalysisNodeDefs({ entity, chain: this.chain })(this.survey).length > 0
    )
  }

  async _initEntities() {
    // GET entities in survey in order
    const { root } = Survey.getHierarchy()(this._survey)

    // get survey entities in order
    const entities = []
    Survey.traverseHierarchyItemSync(root, (nodeDef) => {
      if (NodeDef.isEntity(nodeDef)) {
        entities.push(nodeDef)
      }
    })
    this._entities = entities
  }

  async _initSurveyAndChain() {
    this._survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: this.surveyId,
      cycle: this.cycle,
      advanced: true,
      draft: true,
    })

    const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId({ surveyId: this.surveyId })
    const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId({ surveyId: this.surveyId })

    this._survey = Survey.assocCategories(categories)(this.survey)
    this._survey = Survey.assocTaxonomies(taxonomies)(this.survey)
    this._chain = await AnalysisManager.fetchChain({
      surveyId: this.surveyId,
      chainUuid: this.chainUuid,
      includeScript: true,
    })
    this._listCategories = new ListCategories(this)
    this._listTaxonomies = new ListTaxonomies(this)
    await this._initEntities()
  }

  async _initDirs() {
    // Init dirs
    const surveyInfo = Survey.getSurveyInfo(this.survey)
    const surveyName = Survey.getName(surveyInfo)
    const chainLabel = Chain.getLabel(Survey.getDefaultLanguage(surveyInfo))(this.chain)
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

  async _initAnalysisNodeDefsFiles() {
    await PromiseUtils.each(this.entities, async (entity, entityIndex) => {
      const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({ entity, chain: this.chain })(this.survey)

      if (analysisNodeDefsInEntity.length > 0) {
        const entityPath = FileUtils.join(this.dirUser, `${padStart(entityIndex + 1)}-${NodeDef.getName(entity)}`)
        await FileUtils.mkdir(entityPath)

        // create analysisNodeDefs files
        await PromiseUtils.each(analysisNodeDefsInEntity, async (nodeDef, nodeDefIndex) => {
          this._scriptIndexNext = nodeDefIndex + 1

          let attributeName = NodeDef.getName(nodeDef)

          const rFile = new RFile(this, entityPath, attributeName)

          await rFile.init()

          const script = NodeDef.getPropOrDraftAdvanced(NodeDef.keysPropsAdvanced.script)(nodeDef)
          const entityName = NodeDef.getName(entity)

          if (NodeDef.isCode(nodeDef)) {
            attributeName = `${attributeName}_code`
          }

          const content = StringUtils.isBlank(script) ? setVar(dfVar(entityName, attributeName), NA) : script

          await rFile.appendContent(content)
        })
      }
    })
  }

  async _initFilesClosing() {
    this._filePersistResults = await new RFilePersistResults(this).init()
    this._fileClose = await new RFileClose(this).init() // Check if we should remove this
  }

  async init() {
    await this._initSurveyAndChain()
    await this._initDirs()
    await this._initFiles()
    await this._initAnalysisNodeDefsFiles()
    await this._initFilesClosing()

    return this
  }
}

RChain.dirNames = { user: 'user', system: 'system' }

export default RChain
