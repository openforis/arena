import * as ProcessUtils from '@core/processUtils'
import * as PromiseUtils from '@core/promiseUtils'
import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ObjectUtils from '@core/objectUtils'

import * as Chain from '@common/analysis/chain'
import { SamplingNodeDefs } from '@common/analysis/samplingNodeDefs'

import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import * as AnalysisManager from '../../manager'

import { dfVar, NA, setVar } from './rFunctions'
import RFile, { padStart } from './rFile'
import {
  ListCategories,
  ListTaxonomies,
  RFileClose,
  RFileInit,
  RFileLogin,
  RFilePersistResults,
  RFileReadData,
  RFileStatisticalAnalysis,
} from './rFile/system'
import { RFileCommon, RFileOptionalReporting } from './rFile/user'
import { FileChainSummaryJson } from './rFile/fileChainSummaryJson'

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
    this._dirSampling = null
    this._dirSystem = null
    this._dirResults = null

    // Root files
    this._fileArena = null
    this._fileRStudioProject = null
    this._fileChainSummaryJsonPath = null
    // System files
    this._fileInit = null
    this._fileLogin = null
    this._fileReadData = null
    this._filePersistResults = null
    this._fileStatisticalAnalysis = null
    this.__fileOptionalReporting = null
    this._fileClose = null
    // User files
    this._fileCommon = null

    // Categories
    this._listCategories = null

    // Taxonomies
    this._listTaxonomies = null

    this._entities = []
    this._analysisNodeDefs = []
    this._entitiesWithActiveQuantitativeVariables = []
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

  get dirSampling() {
    return this._dirSampling
  }

  get dirResults() {
    return this._dirResults
  }

  get fileArena() {
    return this._fileArena
  }

  get fileChainSummaryJsonPath() {
    return this._fileChainSummaryJsonPath
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

  get entitiesWithActiveQuantitativeVariables() {
    return this._entitiesWithActiveQuantitativeVariables
  }

  get analysisNodeDefs() {
    return this._analysisNodeDefs
  }

  async _initEntities() {
    const entityDefs = Survey.getAnalysisEntities({ chain: this.chain })(this.survey).filter(
      NodeDef.isInCycle(this.cycle)
    )

    const entitiesWithData = await SurveyRdbManager.filterEntitiesWithData({
      survey: this.survey,
      cycle: this.cycle,
      entityDefs,
    })

    this._entities = entitiesWithData
  }

  async _initSurveyAndChain() {
    this._survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: this.surveyId,
      cycle: this.cycle,
      advanced: true,
      draft: true,
    })
    this._survey = Survey.initAndAssocNodeDefsIndex(this._survey)

    const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId({ surveyId: this.surveyId })
    const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId({ surveyId: this.surveyId })

    this._survey = Survey.assocCategories(categories)(this.survey)
    this._survey = Survey.assocTaxonomies(ObjectUtils.toUuidIndexedObj(taxonomies))(this.survey)
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
    this._dirSampling = FileUtils.join(this._dir, this.dirNames.sampling)
    this._dirResults = FileUtils.join(this.dirNames.system, 'results')
    await Promise.all([
      FileUtils.mkdir(this._dirSystem),
      FileUtils.mkdir(this._dirUser),
      FileUtils.mkdir(this._dirSampling),
    ])
  }

  async _initFiles() {
    // Init root files
    this._fileArena = FileUtils.join(this._dir, 'arena.R')
    this._fileRStudioProject = FileUtils.join(this._dir, 'r_studio_project.Rproj')
    this._fileChainSummaryJsonPath = await FileChainSummaryJson.initFile({
      dir: this.dir,
      surveyId: this.surveyId,
      chainUuid: this.chainUuid,
      cycle: this.cycle,
    })

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

  async _initNodeDefFile({ nodeDef, index, path }) {
    const parentEntity = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(this.survey)
    const entityName = NodeDef.getName(parentEntity)
    let attributeName = NodeDef.getName(nodeDef)
    const fileIndex = padStart(
      Number((index || index === 0) && !Number.isNaN(index) ? index : NodeDef.getChainIndex(nodeDef)) + 1
    )

    let prefix = `-${entityName}`
    let attributeNameInFile = attributeName
    if (NodeDef.isBaseUnit(nodeDef)) {
      prefix = '-base-unit'
    }

    if (NodeDef.isSampling(nodeDef) && !NodeDef.isAreaBasedEstimatedOf(nodeDef) && !NodeDef.isBaseUnit(nodeDef)) {
      prefix = ''
      attributeNameInFile = attributeNameInFile.replace(`${entityName}_`, `${entityName}-`)
    }

    const fileName = `${fileIndex}${prefix}-${attributeNameInFile}`

    const rFile = new RFile(this, path, fileName)

    await rFile.init()

    const script = NodeDef.getPropOrDraftAdvanced(NodeDef.keysPropsAdvanced.script)(nodeDef)

    if (NodeDef.isCode(nodeDef)) {
      attributeName = `${attributeName}_code`
    }

    const content = StringUtils.isBlank(script) ? setVar(dfVar(entityName, attributeName), NA) : script

    await rFile.appendContent(content)
  }

  async _initAnalysisNodeDefsFiles() {
    const { chain, survey, entities } = this

    this._analysisNodeDefs = Survey.getAnalysisNodeDefs({ chain })(survey).filter((nodeDef) =>
      // get only analysis node defs in entities with data
      entities.find((entityDef) => NodeDef.getParentUuid(nodeDef) === NodeDef.getUuid(entityDef))
    )

    const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

    this._entitiesWithActiveQuantitativeVariables = entities.filter(
      (entityDef) =>
        // always include base unit entity
        NodeDef.isEqual(entityDef)(baseUnitNodeDef) ||
        this._analysisNodeDefs.some(
          (analysisNodeDef) =>
            NodeDef.isActive(analysisNodeDef) &&
            !NodeDef.isSampling(analysisNodeDef) &&
            NodeDef.getParentUuid(analysisNodeDef) === NodeDef.getUuid(entityDef)
        )
    )

    if (this._analysisNodeDefs.length > 0) {
      const samplingPath = this.dirSampling
      await FileUtils.mkdir(samplingPath)

      const samplingDefs = SamplingNodeDefs.getSamplingDefsInEntities({
        survey,
        chain,
        entities: this.entitiesWithActiveQuantitativeVariables,
        analysisNodeDefs: this.analysisNodeDefs,
      })

      await PromiseUtils.each(samplingDefs, async (nodeDef, index) => {
        await this._initNodeDefFile({ nodeDef, index: index - 1, path: samplingPath })
      })

      const entityPath = this.dirUser
      await FileUtils.mkdir(entityPath)

      await PromiseUtils.each(
        this._analysisNodeDefs.filter((_nodeDef) => !NodeDef.isSampling(_nodeDef)),
        async (nodeDef) => {
          await this._initNodeDefFile({ nodeDef, path: entityPath })
          const areaBasedEstimated = Survey.getNodeDefAreaBasedEstimate(nodeDef)(this.survey)

          // at this moment we dont like to have the areaBasedEstimated files
          const DO_WE_LIKE_THE_AREA_BASED_ESTIMATED_FILES = false
          if (areaBasedEstimated && DO_WE_LIKE_THE_AREA_BASED_ESTIMATED_FILES) {
            await this._initNodeDefFile({
              nodeDef: areaBasedEstimated,
              path: entityPath,
              index: NodeDef.getChainIndex(nodeDef),
            })
          }
        }
      )
    }
  }

  async _initFilesClosing() {
    this._filePersistResults = await new RFilePersistResults(this).init()
    this._fileStatisticalAnalysis = await new RFileStatisticalAnalysis(this).init()
    this._fileOptionalReporting = await new RFileOptionalReporting(this).init()
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

RChain.dirNames = { user: 'user', system: 'system', sampling: 'sampling' }

export default RChain
