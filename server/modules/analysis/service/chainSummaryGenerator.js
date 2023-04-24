import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import SystemError from '@core/systemError'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

import * as ChainManager from '../manager'

const getCycleLabel = (cycleKey) => `${Number(cycleKey) + 1}`

const generateSurveySummary = ({ survey, lang }) => ({
  surveyName: Survey.getName(survey),
  surveyLabel: Survey.getLabel(survey, lang),
  surveyDescription: Survey.getDescription(lang, '')(survey),
})

const fetchCategoryNameByUuid = async ({ survey, categoryUuid }) => {
  const category = await CategoryManager.fetchCategoryAndLevelsByUuid({
    surveyId: Survey.getId(survey),
    categoryUuid,
    draft: true,
  })
  return Category.getName(category)
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
  const chainSamplingDesign = Chain.getSamplingDesign(chain)
  const samplingStrategySpecified = !!ChainSamplingDesign.getSamplingStrategy(chainSamplingDesign)

  return {
    entity: NodeDef.getName(entity),
    dimensions: dimensions.map(NodeDef.getName),
    filter: ChainStatisticalAnalysis.getFilter(statisticalAnalysis),
    reportingMethod: ChainStatisticalAnalysis.getReportingMethod(statisticalAnalysis),
    clusteringVariances: ChainStatisticalAnalysis.isClusteringOnlyVariances(statisticalAnalysis),
    nonResponseBiasCorrection: ChainStatisticalAnalysis.isNonResponseBiasCorrection(statisticalAnalysis),
    ...(samplingStrategySpecified ? { pValue: ChainStatisticalAnalysis.getPValue(statisticalAnalysis) } : {}),
  }
}

const generateChainSummary = async ({ surveyId, chainUuid, cycle, lang: langParam = null }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft: true, advanced: true })

  const chain = await ChainManager.fetchChain({ surveyId, chainUuid })
  if (!chain) {
    throw new SystemError('chainNotFound', { chainUuid })
  }

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
  const postStratificationAttributeDef = getNodeDefByUuid(
    ChainSamplingDesign.getPostStratificationAttributeDefUuid(chainSamplingDesign)
  )
  const clusteringEntityDef = getNodeDefByUuid(ChainSamplingDesign.getClusteringNodeDefUuid(chainSamplingDesign))
  const analysisNodeDefs = Survey.getAnalysisNodeDefs({
    chain,
    showSamplingNodeDefs: true,
    showInactiveResultVariables: true,
  })(survey)

  const statisticalAnalysisSummary = generateStatisticalAnalysisSummary({ survey, chain })

  const getCodeAttributeSummary = async (key, codeAttrDef) => ({
    [key]: NodeDef.getName(codeAttrDef),
    [`${key}Category`]: await fetchCategoryNameByUuid({
      survey,
      categoryUuid: NodeDef.getCategoryUuid(codeAttrDef),
    }),
    [`${key}CategoryLevel`]: codeAttrDef ? Survey.getNodeDefCategoryLevelIndex(codeAttrDef)(survey) + 1 : '',
  })

  return {
    ...surveySummary,
    label: Chain.getLabel(lang, defaultLang)(chain),
    selectedCycle: getCycleLabel(cycle),
    cycles: Chain.getCycles(chain).map(getCycleLabel),
    samplingDesign: Chain.hasSamplingDesign(chain),
    baseUnit: NodeDef.getName(baseUnitNodeDef),
    baseUnitEntityKeys,
    ...(samplingStrategySpecified ? { samplingStrategy: samplingStrategyIndex + 1 } : {}),
    ...(ChainSamplingDesign.isStratificationEnabled(chainSamplingDesign)
      ? await getCodeAttributeSummary('stratumAttribute', stratumAttributeDef)
      : {}),
    ...(ChainSamplingDesign.isPostStratificationEnabled(chainSamplingDesign)
      ? await getCodeAttributeSummary('postStratificationAttribute', postStratificationAttributeDef)
      : {}),
    areaWeightingMethod: ChainSamplingDesign.isAreaWeightingMethod(chainSamplingDesign),
    clusteringEntity: NodeDef.getName(clusteringEntityDef),
    clusteringEntityKeys: clusteringEntityDef
      ? Survey.getNodeDefAncestorsKeyAttributes(clusteringEntityDef, true)(survey).map(NodeDef.getName)
      : null,
    resultVariables: await Promise.all(
      analysisNodeDefs.map((analysisNodeDef) => generateResultVariableSummary({ survey, analysisNodeDef, lang }))
    ),
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
