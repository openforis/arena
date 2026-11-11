import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import { SamplingNodeDefs } from '@common/analysis/samplingNodeDefs'
import * as Chain from '@common/analysis/chain'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AnalysisManager from '@server/modules/analysis/manager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import { NodeDefAreaBasedEstimateManager } from '@server/modules/nodeDef/manager/nodeDefAreaBasedEstimateManager'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType, keysPropsAdvanced } = NodeDef

const PLOT_AREA_NAME = 'tree_plot_area_'
const WEIGHT_NAME = 'weight'
const scriptsByName = {
  [PLOT_AREA_NAME]: 'tree$tree_plot_area_ <- 0.04',
  [WEIGHT_NAME]: 'plot$weight <- 2',
}

const buildSurvey = (user) =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', nodeDefType.integer).key(),
      SB.entity(
        'plot',
        SB.attribute('plot_id', nodeDefType.integer).key(),
        SB.entity('tree', SB.attribute('tree_id', nodeDefType.integer).key()).multiple()
      ).multiple()
    )
  ).buildAndStore()

const fetchSurveyFull = (surveyId) =>
  SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true, includeAnalysis: true })

const findChainNodeDef = ({ survey, chainUuid, name }) =>
  Survey.getNodeDefsArray(survey).find(
    (nodeDef) => NodeDef.getChainUuid(nodeDef) === chainUuid && NodeDef.getName(nodeDef) === name
  )

// Inserts a quantitative analysis attribute in the "tree" entity, with its area based estimate.
const insertAreaBasedAttribute = async ({ survey, chainUuid, name }) => {
  const surveyId = Survey.getId(survey)
  const nodeDef = NodeDef.newNodeDef(
    Survey.getNodeDefByName('tree')(survey),
    nodeDefType.decimal,
    [Survey.cycleOneKey],
    { [NodeDef.propKeys.name]: name },
    {
      [keysPropsAdvanced.chainUuid]: chainUuid,
      [keysPropsAdvanced.active]: true,
      [keysPropsAdvanced.hasAreaBasedEstimated]: true,
    },
    true
  )
  await NodeDefManager.insertNodeDefsBatch({ surveyId, nodeDefs: [nodeDef] })
  await NodeDefAreaBasedEstimateManager.insertNodeDefAreaBasedEstimate({
    survey: await fetchSurveyFull(surveyId),
    chainUuid,
    estimatedOfNodeDef: nodeDef,
  })
}

describe('Clone chain from another survey - sampling node defs', () => {
  let sourceSurvey
  let targetSurvey
  let sourceChainUuid
  let sourceChainSharingPlotAreaUuid

  const clone = async (chainUuid) => {
    const clonedChain = await AnalysisManager.cloneChainFromSurvey({
      user: getContextUser(),
      surveyId: Survey.getId(targetSurvey),
      sourceSurveyId: Survey.getId(sourceSurvey),
      sourceChainUuid: chainUuid,
    })
    return { clonedChain, survey: await fetchSurveyFull(Survey.getId(targetSurvey)) }
  }

  beforeAll(async () => {
    const user = getContextUser()
    sourceChainUuid = uuidv4()
    sourceChainSharingPlotAreaUuid = uuidv4()

    sourceSurvey = await buildSurvey(user)
    const surveyId = Survey.getId(sourceSurvey)
    const samplingDesign = {
      [ChainSamplingDesign.keysProps.baseUnitNodeDefUuid]: NodeDef.getUuid(
        Survey.getNodeDefByName('plot')(sourceSurvey)
      ),
    }
    await ChainRepository.insertChain({
      surveyId,
      chain: {
        uuid: sourceChainUuid,
        props: { name: 'chain_src', [Chain.keysProps.samplingDesign]: samplingDesign },
      },
    })
    await insertAreaBasedAttribute({ survey: sourceSurvey, chainUuid: sourceChainUuid, name: 'agb' })

    // Sampling node defs are generated on publish, then their scripts are edited by the user.
    const chain = await ChainRepository.fetchChain({ surveyId, chainUuid: sourceChainUuid })
    const { nodeDefsToCreate } = SamplingNodeDefs.determinePlotAreaNodeDefs({
      survey: await fetchSurveyFull(surveyId),
      chain,
    })
    await NodeDefManager.insertNodeDefsBatch({
      surveyId,
      nodeDefs: nodeDefsToCreate.map((nodeDef) =>
        NodeDef.assocProp({ key: keysPropsAdvanced.script, value: scriptsByName[NodeDef.getName(nodeDef)] })(nodeDef)
      ),
    })

    // This chain uses the plot area node def of the first chain: there can be only one per entity.
    await ChainRepository.insertChain({
      surveyId,
      chain: { uuid: sourceChainSharingPlotAreaUuid, props: { name: 'chain_sharing_plot_area_src' } },
    })
    await insertAreaBasedAttribute({
      survey: sourceSurvey,
      chainUuid: sourceChainSharingPlotAreaUuid,
      name: 'carbon',
    })
  })

  beforeEach(async () => {
    targetSurvey = await buildSurvey(getContextUser())
  })

  afterEach(async () => {
    await SurveyManager.deleteSurvey(Survey.getId(targetSurvey))
  })

  afterAll(async () => {
    if (sourceSurvey) await SurveyManager.deleteSurvey(Survey.getId(sourceSurvey))
  })

  test('Sampling node defs are cloned with their scripts', async () => {
    const { clonedChain, survey } = await clone(sourceChainUuid)
    const chainUuid = Chain.getUuid(clonedChain)

    const plotArea = findChainNodeDef({ survey, chainUuid, name: PLOT_AREA_NAME })
    expect(NodeDef.isSampling(plotArea)).toBe(true)
    expect(NodeDef.getScript(plotArea)).toBe(scriptsByName[PLOT_AREA_NAME])

    const weight = findChainNodeDef({ survey, chainUuid, name: WEIGHT_NAME })
    expect(NodeDef.getScript(weight)).toBe(scriptsByName[WEIGHT_NAME])
  })

  test('Area based estimates refer to the cloned attributes', async () => {
    const { clonedChain, survey } = await clone(sourceChainUuid)
    const chainUuid = Chain.getUuid(clonedChain)

    const agb = findChainNodeDef({ survey, chainUuid, name: 'agb' })
    const agbHa = findChainNodeDef({ survey, chainUuid, name: 'agb_ha' })

    expect(NodeDef.getAreaBasedEstimatedOf(agbHa)).toBe(NodeDef.getUuid(agb))
    expect(Survey.getNodeDefAreaBasedEstimate(agb)(survey)).toBeDefined()
  })

  test('A plot area node def belonging to another chain is cloned too', async () => {
    const { clonedChain, survey } = await clone(sourceChainSharingPlotAreaUuid)
    const chainUuid = Chain.getUuid(clonedChain)

    const plotArea = findChainNodeDef({ survey, chainUuid, name: PLOT_AREA_NAME })
    expect(NodeDef.getScript(plotArea)).toBe(scriptsByName[PLOT_AREA_NAME])
  })

  test('Cloned sampling node defs are preserved on survey publish', async () => {
    const { clonedChain, survey } = await clone(sourceChainUuid)

    const { nodeDefsToCreate, nodeDefsToDelete } = SamplingNodeDefs.determinePlotAreaNodeDefs({
      survey,
      chain: clonedChain,
    })

    expect(nodeDefsToCreate).toEqual([])
    expect(nodeDefsToDelete).toEqual([])
  })
})
