import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import SystemError from '@core/systemError'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as ChainManager from '../manager'
import { Objects } from '@openforis/arena-core'
import { ArrayUtils } from '@core/arrayUtils'

const getCycleLabel = (cycleKey) => `${Number(cycleKey) + 1}`

const generateSurveySummary = ({ survey, lang }) => ({
  surveyName: Survey.getName(survey),
  surveyLabel: Survey.getLabel(survey, lang),
  surveyDescription: Survey.getDescription(lang, '')(survey),
})

const getCategoryNameByUuid = ({ survey, categoryUuid }) => {
  const category = Survey.getCategoryByUuid(categoryUuid)(survey)
  return Category.getName(category)
}

const generateResultVariableSummary = ({ survey, analysisNodeDef, lang }) => {
  const categoryName = NodeDef.isCode(analysisNodeDef)
    ? getCategoryNameByUuid({ survey, categoryUuid: NodeDef.getCategoryUuid(analysisNodeDef) })
    : ''
  const entity = Survey.getNodeDefParent(analysisNodeDef)(survey)

  const result = {
    name: NodeDef.getName(analysisNodeDef),
    entity: NodeDef.getName(entity),
    entityPath: Survey.getNodeDefPath({ nodeDef: entity, separator: '/' })(survey),
    label: NodeDef.getLabel(analysisNodeDef, lang),
    areaBased: Boolean(Survey.getNodeDefAreaBasedEstimate(analysisNodeDef)(survey)),
    type: NodeDef.isCode(analysisNodeDef) ? 'C' : 'Q',
    categoryName,
    active: NodeDef.isActive(analysisNodeDef),
  }
  if (NodeDef.isDecimal(analysisNodeDef)) {
    const decimalDigits = NodeDef.getMaxNumberDecimalDigits(analysisNodeDef)
    result['decimalDigits'] = Objects.isEmpty(decimalDigits) ? '' : String(decimalDigits)
  }
  return result
}

const generateStatisticalAnalysisSummary = ({ survey, chain }) => {
  const statisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  if (ChainStatisticalAnalysis.isEmpty(statisticalAnalysis)) return {}

  const entity = Survey.getNodeDefByUuid(ChainStatisticalAnalysis.getEntityDefUuid(statisticalAnalysis))(survey)
  const dimensions = Survey.getNodeDefsByUuids(ChainStatisticalAnalysis.getDimensionUuids(statisticalAnalysis))(survey)
  const chainSamplingDesign = Chain.getSamplingDesign(chain)
  const samplingStrategySpecified = !!ChainSamplingDesign.getSamplingStrategy(chainSamplingDesign)

  return {
    analysis: {
      entity: NodeDef.getName(entity),
      dimensions: dimensions.map(NodeDef.getName),
      filter: ChainStatisticalAnalysis.getFilter(statisticalAnalysis),
      reportingMethod: ChainStatisticalAnalysis.getReportingMethod(statisticalAnalysis),
      clusteringVariances: ChainStatisticalAnalysis.isClusteringOnlyVariances(statisticalAnalysis),
      nonResponseBiasCorrection: ChainStatisticalAnalysis.isNonResponseBiasCorrection(statisticalAnalysis),
      ...(samplingStrategySpecified ? { pValue: ChainStatisticalAnalysis.getPValue(statisticalAnalysis) } : {}),
      reportingArea: ChainStatisticalAnalysis.getReportingArea(statisticalAnalysis),
    },
  }
}

const generateCategoryAttributeAncestorsSummary = ({ survey }) => {
  const hierarchicalCategories = Survey.getCategoriesArray(survey).filter(Category.isHierarchical)
  if (hierarchicalCategories.length === 0) {
    return {}
  }
  const hierarchicalCategoriesUuids = hierarchicalCategories.map(Category.getUuid)

  const codeAttributes2ndLevel = Survey.getNodeDefsArray(survey).filter(
    (nodeDef) =>
      NodeDef.isCode(nodeDef) &&
      hierarchicalCategoriesUuids.includes(NodeDef.getCategoryUuid(nodeDef)) &&
      !!NodeDef.getParentCodeDefUuid(nodeDef)
  )

  const categoryAttributeAncestors = codeAttributes2ndLevel.map((nodeDef) => ({
    attribute: NodeDef.getName(nodeDef),
    categoryName: getCategoryNameByUuid({
      survey,
      categoryUuid: NodeDef.getCategoryUuid(nodeDef),
    }),
    categoryLevel: Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey) + 1,
    ancestors: Survey.getNodeDefAncestorCodes(nodeDef)(survey).map(NodeDef.getName),
  }))

  ArrayUtils.sortByProps(['categoryName', 'categoryLevel'])(categoryAttributeAncestors)

  return {
    categoryAttributeAncestors,
  }
}

const generateChainSummary = async ({ surveyId, chainUuid, cycle, lang: langParam = null }) => {
  const chain = await ChainManager.fetchChain({ surveyId, chainUuid })
  if (!chain) {
    throw new SystemError('chainNotFound', { chainUuid })
  }

  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId,
    cycle,
    draft: true,
    advanced: true,
  })

  const defaultLang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))
  const lang = langParam || defaultLang
  const surveySummary = generateSurveySummary({ survey, lang })

  const getNodeDefByUuid = (uuid) => Survey.getNodeDefByUuid(uuid)(survey)

  const chainSamplingDesign = Chain.getSamplingDesign(chain)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const baseUnitEntityKeys = baseUnitNodeDef
    ? Survey.getNodeDefAncestorsKeyAttributes(baseUnitNodeDef, true)(survey).map(NodeDef.getName)
    : []
  const samplingStrategyIndex = Object.values(ChainSamplingDesign.samplingStrategies).indexOf(
    ChainSamplingDesign.getSamplingStrategy(chainSamplingDesign)
  )
  const samplingStrategySpecified = samplingStrategyIndex >= 0
  const stratumAttributeDef = getNodeDefByUuid(ChainSamplingDesign.getStratumNodeDefUuid(chainSamplingDesign))
  // const postStratificationAttributeDef = getNodeDefByUuid(
  //   ChainSamplingDesign.getPostStratificationAttributeDefUuid(chainSamplingDesign)
  // )
  const firstPhaseCommonAttributeDef = getNodeDefByUuid(
    ChainSamplingDesign.getFirstPhaseCommonAttributeUuid(chainSamplingDesign)
  )
  const clusteringEntityDef = getNodeDefByUuid(ChainSamplingDesign.getClusteringNodeDefUuid(chainSamplingDesign))
  const analysisNodeDefs = Survey.getAnalysisNodeDefs({
    chain,
    showSamplingNodeDefs: true,
    showInactiveResultVariables: true,
  })(survey)

  const getCodeAttributeSummary = (key, codeAttrDef) => ({
    [key]: NodeDef.getName(codeAttrDef),
    [`${key}Category`]: getCategoryNameByUuid({
      survey,
      categoryUuid: NodeDef.getCategoryUuid(codeAttrDef),
    }),
    [`${key}CategoryLevel`]: codeAttrDef ? Survey.getNodeDefCategoryLevelIndex(codeAttrDef)(survey) + 1 : '',
  })

  return {
    ...surveySummary,
    label: Chain.getLabel(lang, defaultLang)(chain),
    selectedLanguage: lang,
    selectedCycle: getCycleLabel(cycle),
    cycles: Chain.getCycles(chain).map(getCycleLabel),
    samplingDesign: Chain.hasSamplingDesign(chain),
    baseUnit: NodeDef.getName(baseUnitNodeDef),
    baseUnitEntityKeys,
    ...(samplingStrategySpecified ? { samplingStrategy: samplingStrategyIndex + 1 } : {}),
    ...(ChainSamplingDesign.isStratificationEnabled(chainSamplingDesign)
      ? getCodeAttributeSummary('stratumAttribute', stratumAttributeDef)
      : {}),
    ...(ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(chainSamplingDesign)
      ? {
          phase1Category: getCategoryNameByUuid({
            survey,
            categoryUuid: ChainSamplingDesign.getFirstPhaseCategoryUuid(chainSamplingDesign),
          }),
        }
      : {}),
    ...(ChainSamplingDesign.isFirstPhaseCommonAttributeSelectionEnabled(chainSamplingDesign)
      ? getCodeAttributeSummary('commonAttribute', firstPhaseCommonAttributeDef)
      : {}),
    ...(ChainSamplingDesign.isPostStratificationEnabled(chainSamplingDesign)
      ? { postStratificationAttribute: '' } // not supoprted in R script yet, keep it blank
      : //  getCodeAttributeSummary('postStratificationAttribute', postStratificationAttributeDef)
        {}),
    areaWeightingMethod: ChainSamplingDesign.isAreaWeightingMethod(chainSamplingDesign),
    clusteringEntity: NodeDef.getName(clusteringEntityDef),
    clusteringEntityKeys: clusteringEntityDef
      ? Survey.getNodeDefAncestorsKeyAttributes(clusteringEntityDef, true)(survey).map(NodeDef.getName)
      : null,
    ...generateCategoryAttributeAncestorsSummary({ survey }),
    resultVariables: analysisNodeDefs.map((analysisNodeDef) =>
      generateResultVariableSummary({ survey, analysisNodeDef, lang })
    ),
    ...generateStatisticalAnalysisSummary({ survey, chain }),
  }
}

export const ChainSummaryGenerator = {
  generateChainSummary,
}
