import * as Chain from '@common/analysis/chain'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import SystemError from '@core/systemError'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainManager from '../manager'

export const fetchChainSummary = async ({ surveyId, chainUuid, lang: langParam = null }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })
  const defaultLang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))
  const lang = langParam || defaultLang

  const chain = await ChainManager.fetchChain({ surveyId, chainUuid })
  if (!chain) {
    throw new SystemError('chainNotFound', { chainUuid })
  }
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  const stratumAttributeDef = Survey.getNodeDefByUuid(Chain.getStratumNodeDefUuid(chain))(survey)
  const clusteringNodeDef = Survey.getNodeDefByUuid(Chain.getClusteringNodeDefUuid(chain))(survey)
  const analysisNodeDefs = Survey.getAnalysisNodeDefs({
    chain,
    showSamplingNodeDefs: true,
    showInactiveResultVariables: true,
  })(survey)

  return {
    label: Chain.getLabel(lang, defaultLang)(chain),
    cycles: Chain.getCycles(chain),
    samplingDesign: Chain.isSamplingDesign(chain),
    baseUnit: NodeDef.getName(baseUnitNodeDef),
    stratumAttribute: NodeDef.getName(stratumAttributeDef),
    areaWeightingMethod: Chain.isAreaWeightingMethod(chain),
    clusteringEntity: NodeDef.getName(clusteringNodeDef),
    clusteringVariances: Chain.isClusteringOnlyVariances(chain),
    resultVariables: analysisNodeDefs.map((analysisNodeDef) => ({
      name: NodeDef.getName(analysisNodeDef),
      label: NodeDef.getLabel(analysisNodeDef, lang),
      areaBased: Boolean(Survey.getNodeDefAreaBasedEstimate(analysisNodeDef)(survey)),
      type: NodeDef.isCode(analysisNodeDef) ? 'C' : 'Q',
      active: NodeDef.getActive(analysisNodeDef),
    })),
  }
}
