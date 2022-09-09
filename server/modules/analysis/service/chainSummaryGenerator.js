import * as Chain from '@common/analysis/chain'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as PromiseUtils from '@core/promiseUtils'
import * as StringUtils from '@core/stringUtils'
import SystemError from '@core/systemError'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as ChainManager from '../manager'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

const getCycleLabel = (cycleKey) => `${Number(cycleKey) + 1}`

const generateReportingDataCategoryAttributesSummary = ({ survey, category, chain }) => {
  const levels = Category.getLevelsArray(category)
  const samplingDesign = Chain.getSamplingDesign(chain)

  return levels.reduce((acc, level, levelIndex) => {
    const categoryLevelUuid = CategoryLevel.getUuid(level)
    const attributeDefUuid = ChainSamplingDesign.getReportingDataAttributeDefUuid({ categoryLevelUuid })(samplingDesign)
    if (!attributeDefUuid) {
      return acc
    }
    const attributeDef = Survey.getNodeDefByUuid(attributeDefUuid)(survey)
    return { ...acc, [`attributeLevel${levelIndex + 1}`]: NodeDef.getName(attributeDef) }
  }, {})
}

const fetchCategoryNameByUuid = async ({ survey, categoryUuid }) => {
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({
    surveyId: Survey.getId(survey),
    categoryUuid,
    draft: true,
  })
  return Category.getName(category)
}

const getExtraPropArea = (item) => {
  const area = CategoryItem.getExtraProp(Category.reportingDataItemExtraDefKeys.area)(item)
  return StringUtils.isBlank(area) ? '' : Number(area)
}

const generateReportingDataCategoryItemsSummary = async ({ survey, category, lang }) => {
  const levels = Category.getLevelsArray(category)

  const reportingCategoryItems = []
  await PromiseUtils.each(levels, async (_level, levelIndex) => {
    const items = await CategoryManager.fetchItemsByLevelIndex({
      surveyId: Survey.getId(survey),
      categoryUuid: Category.getUuid(category),
      levelIndex,
      draft: true,
    })
    reportingCategoryItems.push(...items)
  })

  return reportingCategoryItems.map((item) => ({
    // level codes
    ...levels.reduce((acc, level, levelIndex) => {
      const levelCode =
        CategoryItem.getLevelUuid(item) === CategoryLevel.getUuid(level)
          ? CategoryItem.getCode(item) // item is in current level
          : item[`level${levelIndex}Code`] // level code prop is 0 based when it's fetched from DB

      if (StringUtils.isBlank(levelCode)) {
        return acc
      }
      // level code prop is 1 based in the summary
      return { ...acc, [`level${levelIndex + 1}Code`]: levelCode }
    }, {}),

    // label
    label: CategoryItem.getLabel(lang)(item),

    // level index (1 based)
    levelIndex: Category.getItemLevelIndex(item)(category) + 1,

    // area (only for last level items)
    ...(Category.isItemLeaf(item)(category)
      ? {
          area: getExtraPropArea(item),
        }
      : {}),
  }))
}

const generateReportingDataCategorySummary = async ({ survey, chain, lang }) => {
  const samplingDesign = Chain.getSamplingDesign(chain)
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({
    surveyId: Survey.getId(survey),
    categoryUuid: ChainSamplingDesign.getReportingDataCategoryUuid(samplingDesign),
    draft: true,
  })
  if (!category) {
    return null
  }
  const attributes = generateReportingDataCategoryAttributesSummary({ survey, category, chain })

  const items = await generateReportingDataCategoryItemsSummary({ survey, category, lang })

  return {
    name: Category.getName(category),
    attributes,
    items,
  }
}

const generateResultVariableSummary = async ({ survey, analysisNodeDef, lang }) => {
  const categoryName = NodeDef.isCode(analysisNodeDef)
    ? await fetchCategoryNameByUuid({ survey, categoryUuid: NodeDef.getCategoryUuid(analysisNodeDef) })
    : ''
  const entity = Survey.getNodeDefParent(analysisNodeDef)(survey)

  return {
    name: NodeDef.getName(analysisNodeDef),
    entity: NodeDef.getName(entity),
    entityPath: Survey.getNodeDefPath({ nodeDef: entity, separator: '/' })(survey),
    label: NodeDef.getLabel(analysisNodeDef, lang),
    areaBased: Boolean(Survey.getNodeDefAreaBasedEstimate(analysisNodeDef)(survey)),
    type: NodeDef.isCode(analysisNodeDef) ? 'C' : 'Q',
    categoryName,
    active: NodeDef.isActive(analysisNodeDef),
  }
}

const generateStatisticalAnalysisSummary = ({ survey, chain }) => {
  const statisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  if (ChainStatisticalAnalysis.isEmpty(statisticalAnalysis)) return null

  const entity = Survey.getNodeDefByUuid(ChainStatisticalAnalysis.getEntityDefUuid(statisticalAnalysis))(survey)
  const dimensions = Survey.getNodeDefsByUuids(ChainStatisticalAnalysis.getDimensionUuids(statisticalAnalysis))(survey)

  return {
    entity: NodeDef.getName(entity),
    dimensions: dimensions.map(NodeDef.getName),
    filter: ChainStatisticalAnalysis.getFilter(statisticalAnalysis),
    reportingMethod: ChainStatisticalAnalysis.getReportingMethod(statisticalAnalysis),
  }
}

const generateChainSummary = async ({ surveyId, chainUuid, cycle, lang: langParam = null }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft: true, advanced: true })
  const defaultLang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))
  const lang = langParam || defaultLang

  const chain = await ChainManager.fetchChain({ surveyId, chainUuid })
  if (!chain) {
    throw new SystemError('chainNotFound', { chainUuid })
  }

  const getNodeDefByUuid = (uuid) => Survey.getNodeDefByUuid(uuid)(survey)

  const chainSamplingDesign = Chain.getSamplingDesign(chain)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const samplingStrategyIndex = Object.values(ChainSamplingDesign.samplingStrategies).indexOf(
    ChainSamplingDesign.getSamplingStrategy(chainSamplingDesign)
  )
  const samplingStrategySpecified = samplingStrategyIndex >= 0
  const stratumAttributeDef = getNodeDefByUuid(ChainSamplingDesign.getStratumNodeDefUuid(chainSamplingDesign))
  const postStratificationAttributeDef = getNodeDefByUuid(
    ChainSamplingDesign.getPostStratificationAttributeDefUuid(chainSamplingDesign)
  )
  const clusteringNodeDef = getNodeDefByUuid(ChainSamplingDesign.getClusteringNodeDefUuid(chainSamplingDesign))
  const analysisNodeDefs = Survey.getAnalysisNodeDefs({
    chain,
    showSamplingNodeDefs: true,
    showInactiveResultVariables: true,
  })(survey)

  const reportingCategorySummary = await generateReportingDataCategorySummary({ survey, chain, lang })
  const statisticalAnalysisSummary = generateStatisticalAnalysisSummary({ survey, chain })

  return {
    label: Chain.getLabel(lang, defaultLang)(chain),
    selectedCycle: getCycleLabel(cycle),
    cycles: Chain.getCycles(chain).map(getCycleLabel),
    samplingDesign: Chain.hasSamplingDesign(chain),
    baseUnit: NodeDef.getName(baseUnitNodeDef),
    ...(samplingStrategySpecified ? { samplingStrategy: samplingStrategyIndex + 1 } : {}),
    ...(ChainSamplingDesign.isStratificationEnabled(chainSamplingDesign)
      ? {
          stratumAttribute: NodeDef.getName(stratumAttributeDef),
          nonResponseBiasCorrection: ChainSamplingDesign.isNonResponseBiasCorrection(chainSamplingDesign),
        }
      : {}),
    ...(ChainSamplingDesign.isPostStratificationEnabled(chainSamplingDesign)
      ? {
          postStratificationAttribute: NodeDef.getName(postStratificationAttributeDef),
          postStratificationCategory: await fetchCategoryNameByUuid({
            survey,
            categoryUuid: NodeDef.getCategoryUuid(postStratificationAttributeDef),
          }),
        }
      : {}),
    ...(samplingStrategySpecified ? { pValue: ChainSamplingDesign.getPValue(chainSamplingDesign) } : {}),
    areaWeightingMethod: ChainSamplingDesign.isAreaWeightingMethod(chainSamplingDesign),
    clusteringEntity: NodeDef.getName(clusteringNodeDef),
    clusteringEntityKeys: clusteringNodeDef
      ? Survey.getNodeDefKeys(clusteringNodeDef)(survey).map(NodeDef.getName)
      : null,
    clusteringVariances: ChainSamplingDesign.isClusteringOnlyVariances(chainSamplingDesign),
    resultVariables: await Promise.all(
      analysisNodeDefs.map((analysisNodeDef) => generateResultVariableSummary({ survey, analysisNodeDef, lang }))
    ),
    ...(reportingCategorySummary
      ? {
          reportingCategory: reportingCategorySummary,
        }
      : {}),
    ...(statisticalAnalysisSummary
      ? {
          analysis: statisticalAnalysisSummary,
        }
      : {}),
  }
}

export const ChainSummaryGenerator = {
  generateChainSummary,
}
