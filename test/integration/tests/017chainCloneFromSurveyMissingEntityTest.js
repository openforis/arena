import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AnalysisManager from '@server/modules/analysis/manager'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef

describe('Clone chain from another survey - missing entities', () => {
  let sourceSurvey
  let targetSurvey
  let targetSurveyEmpty
  let sourceChainUuid

  beforeAll(async () => {
    const user = getContextUser()
    sourceChainUuid = uuidv4()

    // Source survey: root entity "cluster_src" (exists in target) with an analysis attribute,
    // plus a nested multiple entity "plot_src" (missing in target) with its own analysis attribute.
    sourceSurvey = await SB.survey(
      user,
      SB.entity(
        'cluster_src',
        SB.attribute('cluster_id_src', nodeDefType.integer).key(),
        SB.attribute('volume_analysis_src', nodeDefType.decimal)
          .analysis()
          .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, sourceChainUuid),
        SB.entity(
          'plot_src',
          SB.attribute('plot_id_src', nodeDefType.integer).key(),
          SB.attribute('biomass_analysis_src', nodeDefType.decimal)
            .analysis()
            .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, sourceChainUuid)
        ).multiple()
      )
    ).buildAndStore()

    await ChainRepository.insertChain({
      surveyId: Survey.getId(sourceSurvey),
      chain: { uuid: sourceChainUuid, props: { name: 'chain_missing_entity_src' } },
    })

    // Target survey only has "cluster_src" - "plot_src" does not exist here.
    targetSurvey = await SB.survey(
      user,
      SB.entity('cluster_src', SB.attribute('cluster_id_tgt', nodeDefType.integer).key())
    ).buildAndStore()

    // Target survey with neither "cluster_src" nor "plot_src" - every source analysis attribute's
    // parent entity is missing here.
    targetSurveyEmpty = await SB.survey(
      user,
      SB.entity('other_entity_tgt', SB.attribute('other_id_tgt', nodeDefType.integer).key())
    ).buildAndStore()
  })

  afterAll(async () => {
    if (sourceSurvey) await SurveyManager.deleteSurvey(Survey.getId(sourceSurvey))
    if (targetSurvey) await SurveyManager.deleteSurvey(Survey.getId(targetSurvey))
    if (targetSurveyEmpty) await SurveyManager.deleteSurvey(Survey.getId(targetSurveyEmpty))
  })

  test('Cloning without the skip flag throws when an entity is missing in the target survey', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    await expect(
      AnalysisManager.cloneChainFromSurvey({
        user,
        surveyId: targetSurveyId,
        sourceSurveyId,
        sourceChainUuid,
      })
    ).rejects.toThrow('chainView.cloneFromAnotherSurveyDialog.missingEntities')
  })

  test('Cloning with skipMissingEntityAttributes clones only attributes whose entity exists in the target survey', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    await AnalysisManager.cloneChainFromSurvey({
      user,
      surveyId: targetSurveyId,
      sourceSurveyId,
      sourceChainUuid,
      skipMissingEntityAttributes: true,
    })

    const targetSurveyRefetched = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: targetSurveyId,
      draft: true,
      advanced: true,
      includeAnalysis: true,
    })

    const clonedAttrs = Survey.getNodeDefsArray(targetSurveyRefetched).filter(NodeDef.isAnalysis)
    const clonedNames = clonedAttrs.map(NodeDef.getName)

    // The attribute belonging to "cluster_src" (exists in target) was cloned.
    expect(clonedNames).toContain('volume_analysis_src')
    // The attribute belonging to "plot_src" (missing in target) was skipped.
    expect(clonedNames).not.toContain('biomass_analysis_src')
    // "plot_src" itself was not created in the target survey.
    expect(Survey.findNodeDefByName('plot_src')(targetSurveyRefetched)).toBeUndefined()
  })

  test('Cloning with skipMissingEntityAttributes remaps chain-level nodeDef references (e.g. sampling design base unit) without throwing when the referenced entity is skipped', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    // "plot_src" is the entity missing in the target survey; use it as the sampling design's
    // base unit in a dedicated source chain, so cloning must remap (and drop) this reference.
    const plotSrcEntity = Survey.findNodeDefByName('plot_src')(sourceSurvey)
    const samplingDesignChainUuid = uuidv4()

    await ChainRepository.insertChain({
      surveyId: sourceSurveyId,
      chain: {
        uuid: samplingDesignChainUuid,
        props: {
          name: 'chain_sampling_design_src',
          [Chain.keysProps.samplingDesign]: {
            [ChainSamplingDesign.keysProps.baseUnitNodeDefUuid]: NodeDef.getUuid(plotSrcEntity),
          },
        },
      },
    })

    const clonedChain = await AnalysisManager.cloneChainFromSurvey({
      user,
      surveyId: targetSurveyId,
      sourceSurveyId,
      sourceChainUuid: samplingDesignChainUuid,
      skipMissingEntityAttributes: true,
    })

    expect(clonedChain).toBeDefined()
    const clonedSamplingDesign = Chain.getSamplingDesign(clonedChain)
    expect(ChainSamplingDesign.getBaseUnitNodeDefUuid(clonedSamplingDesign)).toBeUndefined()
  })

  test('Cloning with skipMissingEntityAttributes remaps the phase 2 join entity/attribute and drops the phase 1 category/join attribute', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    const clusterSrcEntity = Survey.findNodeDefByName('cluster_src')(sourceSurvey)
    const volumeAnalysisAttr = Survey.findNodeDefByName('volume_analysis_src')(sourceSurvey)
    const phase2ChainUuid = uuidv4()

    await ChainRepository.insertChain({
      surveyId: sourceSurveyId,
      chain: {
        uuid: phase2ChainUuid,
        props: {
          name: 'chain_phase2_join_props_src',
          [Chain.keysProps.samplingDesign]: {
            [ChainSamplingDesign.keysProps.samplingStrategy]: ChainSamplingDesign.samplingStrategies.twoPhase,
            [ChainSamplingDesign.keysProps.phase1CategoryUuid]: 'category-uuid',
            [ChainSamplingDesign.keysProps.phase1JoinAttribute]: 'design_psu',
            [ChainSamplingDesign.keysProps.phase2JoinEntityUuid]: NodeDef.getUuid(clusterSrcEntity),
            [ChainSamplingDesign.keysProps.phase2JoinAttribute]: NodeDef.getUuid(volumeAnalysisAttr),
          },
        },
      },
    })

    const clonedChain = await AnalysisManager.cloneChainFromSurvey({
      user,
      surveyId: targetSurveyId,
      sourceSurveyId,
      sourceChainUuid: phase2ChainUuid,
      skipMissingEntityAttributes: true,
    })

    const clonedSamplingDesign = Chain.getSamplingDesign(clonedChain)
    expect(ChainSamplingDesign.getPhase1CategoryUuid(clonedSamplingDesign)).toBeUndefined()
    expect(ChainSamplingDesign.getPhase1JoinAttribute(clonedSamplingDesign)).toBeUndefined()

    // "cluster_src" and its analysis attribute both exist in the target survey by name, so they
    // remap; re-fetch the target survey so this reflects the attribute cloned onto it by the
    // earlier "clones only attributes..." test rather than the stale outer `targetSurvey` built
    // in `beforeAll` (which predates that clone).
    const targetSurveyRefetched = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: targetSurveyId,
      draft: true,
      advanced: true,
      includeAnalysis: true,
    })
    const targetClusterSrcEntity = Survey.findNodeDefByName('cluster_src')(targetSurveyRefetched)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(clonedSamplingDesign)).toBe(
      NodeDef.getUuid(targetClusterSrcEntity)
    )
    const targetVolumeAnalysisAttr = Survey.findNodeDefByName('volume_analysis_src')(targetSurveyRefetched)
    expect(ChainSamplingDesign.getPhase2JoinAttribute(clonedSamplingDesign)).toBe(
      NodeDef.getUuid(targetVolumeAnalysisAttr)
    )
  })

  test('Cloning with skipMissingEntityAttributes succeeds with zero cloned attributes when every entity is missing in the target survey', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyEmptyId = Survey.getId(targetSurveyEmpty)

    const clonedChain = await AnalysisManager.cloneChainFromSurvey({
      user,
      surveyId: targetSurveyEmptyId,
      sourceSurveyId,
      sourceChainUuid,
      skipMissingEntityAttributes: true,
    })

    expect(clonedChain).toBeDefined()

    const targetSurveyEmptyRefetched = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: targetSurveyEmptyId,
      draft: true,
      advanced: true,
      includeAnalysis: true,
    })

    const clonedAttrs = Survey.getNodeDefsArray(targetSurveyEmptyRefetched).filter(NodeDef.isAnalysis)
    expect(clonedAttrs).toHaveLength(0)
  })
})
