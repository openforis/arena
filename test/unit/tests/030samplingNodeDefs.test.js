import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { SamplingNodeDefs } from '@common/analysis/samplingNodeDefs'
import { AreaBasedEstimatedOfNodeDef } from '@common/analysis/areaBasedEstimatedNodeDef'

import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-sampling-node-defs-user' }

const CHAIN_UUID = 'test-chain-uuid'
const OTHER_CHAIN_UUID = 'test-other-chain-uuid'

const newChain = ({ chainUuid = CHAIN_UUID, baseUnitNodeDefUuid }) => ({
  uuid: chainUuid,
  props: { samplingDesign: { baseUnitNodeDefUuid } },
})

// builds an active, chain-scoped quantitative analysis attribute (e.g. a "volume" measurement)
const quantitativeAnalysisAttribute = (name, chainUuid = CHAIN_UUID) =>
  SB.attribute(name, NodeDef.nodeDefType.decimal)
    .analysis()
    .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, chainUuid)
    .propAdvanced(NodeDef.keysPropsAdvanced.active, true)

const addAreaBasedEstimateNodeDef = ({ survey, estimatedOfNodeDefName, chainUuid = CHAIN_UUID, active = true }) => {
  const estimatedOfNodeDef = Survey.getNodeDefByName(estimatedOfNodeDefName)(survey)
  let nodeDef = AreaBasedEstimatedOfNodeDef.newNodeDef({ survey, chainUuid, estimatedOfNodeDef })
  if (!active) {
    nodeDef = { ...nodeDef, propsAdvanced: { ...nodeDef.propsAdvanced, [NodeDef.keysPropsAdvanced.active]: false } }
  }
  return { survey: Survey.assocNodeDef({ nodeDef })(survey), nodeDef }
}

// mimics the sampling node defs created by SamplingNodeDefs.determinePlotAreaNodeDefs, for pre-existing fixtures
const newSamplingNodeDefFixture = ({ nodeDefParent, name, chainUuid = CHAIN_UUID, active = true }) =>
  NodeDef.newNodeDef(
    nodeDefParent,
    NodeDef.nodeDefType.decimal,
    [Survey.cycleOneKey],
    { [NodeDef.propKeys.name]: name },
    {
      [NodeDef.keysPropsAdvanced.chainUuid]: chainUuid,
      [NodeDef.keysPropsAdvanced.active]: active,
      [NodeDef.keysPropsAdvanced.index]: -1,
      [NodeDef.keysPropsAdvanced.isBaseUnit]: false,
      [NodeDef.keysPropsAdvanced.isSampling]: true,
    },
    true, // analysis
    false // virtual
  )

const findCreated = (nodeDefsToCreate, name) => nodeDefsToCreate.find((nodeDef) => NodeDef.getName(nodeDef) === name)

describe('SamplingNodeDefs.determinePlotAreaNodeDefs', () => {
  it('creates weight and plot area node defs for a base unit and a sibling entity (not a descendant)', async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'plot',
        SB.entity('subplot', SB.attribute('subplot_dummy')).multiple(),
        SB.entity('tree', quantitativeAnalysisAttribute('volume')).multiple()
      )
    ).build()

    const { survey: surveyWithHa } = addAreaBasedEstimateNodeDef({ survey, estimatedOfNodeDefName: 'volume' })

    const subplotDef = Survey.getNodeDefByName('subplot')(surveyWithHa)
    const treeDef = Survey.getNodeDefByName('tree')(surveyWithHa)
    const chain = newChain({ baseUnitNodeDefUuid: NodeDef.getUuid(subplotDef) })

    const { nodeDefsToCreate, nodeDefsToDelete } = SamplingNodeDefs.determinePlotAreaNodeDefs({
      survey: surveyWithHa,
      chain,
    })

    expect(nodeDefsToDelete).toHaveLength(0)

    const weightCreated = findCreated(nodeDefsToCreate, 'weight')
    expect(weightCreated).toBeDefined()
    expect(NodeDef.getParentUuid(weightCreated)).toBe(NodeDef.getUuid(subplotDef))

    const plotAreaCreated = findCreated(nodeDefsToCreate, 'tree_plot_area_')
    expect(plotAreaCreated).toBeDefined()
    expect(NodeDef.getParentUuid(plotAreaCreated)).toBe(NodeDef.getUuid(treeDef))

    // simulate persisting the newly created node defs, then re-running the check:
    // neither should be recreated nor (this is the regression the sibling bug caused) deleted
    const surveyPersisted = nodeDefsToCreate.reduce(
      (surveyAcc, nodeDef) => Survey.assocNodeDef({ nodeDef })(surveyAcc),
      surveyWithHa
    )
    const result2 = SamplingNodeDefs.determinePlotAreaNodeDefs({ survey: surveyPersisted, chain })
    expect(result2.nodeDefsToCreate).toHaveLength(0)
    expect(result2.nodeDefsToDelete).toHaveLength(0)
  })

  it('creates both weight and plot area node defs on a childless base unit entity', async () => {
    const survey = await SB.survey(user, SB.entity('plot', quantitativeAnalysisAttribute('volume'))).build()

    const { survey: surveyWithHa } = addAreaBasedEstimateNodeDef({ survey, estimatedOfNodeDefName: 'volume' })

    const plotDef = Survey.getNodeDefByName('plot')(surveyWithHa)
    const chain = newChain({ baseUnitNodeDefUuid: NodeDef.getUuid(plotDef) })

    const { nodeDefsToCreate, nodeDefsToDelete } = SamplingNodeDefs.determinePlotAreaNodeDefs({
      survey: surveyWithHa,
      chain,
    })

    expect(nodeDefsToDelete).toHaveLength(0)

    const weightCreated = findCreated(nodeDefsToCreate, 'weight')
    expect(weightCreated).toBeDefined()
    expect(NodeDef.getParentUuid(weightCreated)).toBe(NodeDef.getUuid(plotDef))

    const plotAreaCreated = findCreated(nodeDefsToCreate, 'plot_plot_area_')
    expect(plotAreaCreated).toBeDefined()
    expect(NodeDef.getParentUuid(plotAreaCreated)).toBe(NodeDef.getUuid(plotDef))
  })

  it('does not create a plot area node def for an inactive area based estimated attribute, and deletes a stale one', async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'plot',
        SB.entity('subplot', SB.attribute('subplot_dummy')).multiple(),
        SB.entity('tree', quantitativeAnalysisAttribute('volume')).multiple()
      )
    ).build()

    const { survey: surveyWithHa } = addAreaBasedEstimateNodeDef({
      survey,
      estimatedOfNodeDefName: 'volume',
      active: false,
    })

    const subplotDef = Survey.getNodeDefByName('subplot')(surveyWithHa)
    const treeDef = Survey.getNodeDefByName('tree')(surveyWithHa)
    const chain = newChain({ baseUnitNodeDefUuid: NodeDef.getUuid(subplotDef) })

    // no stale plot area def yet: none should be created
    const result1 = SamplingNodeDefs.determinePlotAreaNodeDefs({ survey: surveyWithHa, chain })
    expect(findCreated(result1.nodeDefsToCreate, 'tree_plot_area_')).toBeUndefined()

    // a stale plot area def already exists (e.g. left over from before the attribute was deactivated): must be deleted
    const staleNodeDef = newSamplingNodeDefFixture({ nodeDefParent: treeDef, name: 'tree_plot_area_' })
    const surveyWithStaleDef = Survey.assocNodeDef({ nodeDef: staleNodeDef })(surveyWithHa)

    const result2 = SamplingNodeDefs.determinePlotAreaNodeDefs({ survey: surveyWithStaleDef, chain })
    expect(result2.nodeDefsToDelete.map(NodeDef.getUuid)).toContain(NodeDef.getUuid(staleNodeDef))
  })

  it('does not create a plot area node def for an area based estimated attribute belonging to a different chain', async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'plot',
        SB.entity('subplot', SB.attribute('subplot_dummy')).multiple(),
        SB.entity('tree', quantitativeAnalysisAttribute('volume')).multiple()
      )
    ).build()

    const { survey: surveyWithHa } = addAreaBasedEstimateNodeDef({
      survey,
      estimatedOfNodeDefName: 'volume',
      chainUuid: OTHER_CHAIN_UUID,
    })

    const subplotDef = Survey.getNodeDefByName('subplot')(surveyWithHa)
    const chain = newChain({ chainUuid: CHAIN_UUID, baseUnitNodeDefUuid: NodeDef.getUuid(subplotDef) })

    const { nodeDefsToCreate } = SamplingNodeDefs.determinePlotAreaNodeDefs({ survey: surveyWithHa, chain })

    expect(findCreated(nodeDefsToCreate, 'tree_plot_area_')).toBeUndefined()
  })

  it('deletes a plot area node def with a stale name after the entity has been renamed', async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'plot',
        SB.entity('subplot', SB.attribute('subplot_dummy')).multiple(),
        SB.entity('tree', quantitativeAnalysisAttribute('volume')).multiple()
      )
    ).build()

    const { survey: surveyWithHa } = addAreaBasedEstimateNodeDef({ survey, estimatedOfNodeDefName: 'volume' })

    const subplotDef = Survey.getNodeDefByName('subplot')(surveyWithHa)
    const treeDef = Survey.getNodeDefByName('tree')(surveyWithHa)

    // simulate a stale plot area node def left over from before "tree" was renamed
    const staleNodeDef = newSamplingNodeDefFixture({ nodeDefParent: treeDef, name: 'old_tree_name_plot_area_' })
    const surveyWithStaleDef = Survey.assocNodeDef({ nodeDef: staleNodeDef })(surveyWithHa)

    const chain = newChain({ baseUnitNodeDefUuid: NodeDef.getUuid(subplotDef) })
    const { nodeDefsToCreate, nodeDefsToDelete } = SamplingNodeDefs.determinePlotAreaNodeDefs({
      survey: surveyWithStaleDef,
      chain,
    })

    expect(nodeDefsToDelete.map(NodeDef.getUuid)).toContain(NodeDef.getUuid(staleNodeDef))

    const plotAreaCreated = findCreated(nodeDefsToCreate, 'tree_plot_area_')
    expect(plotAreaCreated).toBeDefined()
    expect(NodeDef.getParentUuid(plotAreaCreated)).toBe(NodeDef.getUuid(treeDef))
  })

  it('creates a weight node def for the current chain when the base unit already has one belonging to another chain', async () => {
    const survey = await SB.survey(user, SB.entity('plot', quantitativeAnalysisAttribute('volume'))).build()

    const { survey: surveyWithHa } = addAreaBasedEstimateNodeDef({ survey, estimatedOfNodeDefName: 'volume' })

    const plotDef = Survey.getNodeDefByName('plot')(surveyWithHa)

    // another chain already has its own weight node def under the same base unit
    const otherChainWeightNodeDef = newSamplingNodeDefFixture({
      nodeDefParent: plotDef,
      name: 'weight',
      chainUuid: OTHER_CHAIN_UUID,
    })
    const surveyWithOtherChainWeight = Survey.assocNodeDef({ nodeDef: otherChainWeightNodeDef })(surveyWithHa)

    const chain = newChain({ chainUuid: CHAIN_UUID, baseUnitNodeDefUuid: NodeDef.getUuid(plotDef) })
    const { nodeDefsToCreate, nodeDefsToDelete } = SamplingNodeDefs.determinePlotAreaNodeDefs({
      survey: surveyWithOtherChainWeight,
      chain,
    })

    // the other chain's weight node def must not be reused nor deleted
    expect(nodeDefsToDelete.map(NodeDef.getUuid)).not.toContain(NodeDef.getUuid(otherChainWeightNodeDef))

    const weightCreated = findCreated(nodeDefsToCreate, 'weight')
    expect(weightCreated).toBeDefined()
    expect(NodeDef.getParentUuid(weightCreated)).toBe(NodeDef.getUuid(plotDef))
    expect(NodeDef.getChainUuid(weightCreated)).toBe(CHAIN_UUID)
  })

  it('AreaBasedEstimatedOfNodeDef.updateNodeDef syncs the active state from the estimated attribute', async () => {
    const survey = await SB.survey(user, SB.entity('plot', quantitativeAnalysisAttribute('volume'))).build()

    const { survey: surveyWithHa, nodeDef: nodeDefAreaBasedEstimate } = addAreaBasedEstimateNodeDef({
      survey,
      estimatedOfNodeDefName: 'volume',
    })
    expect(NodeDef.isActive(nodeDefAreaBasedEstimate)).toBe(true)

    // deactivate the estimated attribute ("volume") itself
    const volumeDef = Survey.getNodeDefByName('volume')(surveyWithHa)
    const volumeDefInactive = NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.active, value: false })(volumeDef)

    const nodeDefAreaBasedEstimateUpdated = AreaBasedEstimatedOfNodeDef.updateNodeDef({
      survey: surveyWithHa,
      nodeDefAreaBasedEstimate,
      areaBasedEstimatedOfNodeDef: volumeDefInactive,
    })

    expect(NodeDef.isActive(nodeDefAreaBasedEstimateUpdated)).toBe(false)
  })

  it('deletes a stale weight node def when the base unit is reassigned to another entity', async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'plot',
        SB.entity('entityA', SB.attribute('a_dummy')).multiple(),
        SB.entity('entityB', SB.attribute('b_dummy')).multiple()
      )
    ).build()

    const entityADef = Survey.getNodeDefByName('entityA')(survey)
    const entityBDef = Survey.getNodeDefByName('entityB')(survey)

    // entityA has a stale weight node def, left over from when it used to be the base unit
    const staleWeightNodeDef = newSamplingNodeDefFixture({ nodeDefParent: entityADef, name: 'weight' })
    const surveyWithStaleWeight = Survey.assocNodeDef({ nodeDef: staleWeightNodeDef })(survey)

    // base unit is now entityB
    const chain = newChain({ baseUnitNodeDefUuid: NodeDef.getUuid(entityBDef) })
    const { nodeDefsToCreate, nodeDefsToDelete } = SamplingNodeDefs.determinePlotAreaNodeDefs({
      survey: surveyWithStaleWeight,
      chain,
    })

    expect(nodeDefsToDelete.map(NodeDef.getUuid)).toContain(NodeDef.getUuid(staleWeightNodeDef))

    const weightCreated = findCreated(nodeDefsToCreate, 'weight')
    expect(weightCreated).toBeDefined()
    expect(NodeDef.getParentUuid(weightCreated)).toBe(NodeDef.getUuid(entityBDef))
  })
})
