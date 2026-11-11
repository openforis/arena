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

describe('Chain sampling design phase props migration', () => {
  let survey
  let chainWithOldPropsUuid
  let chainWithCategoryOnlyUuid
  let chainWithoutOldPropsUuid
  let chainWithAttributeInSiblingBranchUuid
  let chainWithUnknownAttributeUuid
  let commonAttributeUuid
  let siblingBranchAttributeUuid
  let unknownAttributeUuid
  let rootEntityUuid
  let plotEntityUuid
  let plotDetailsEntityUuid

  beforeAll(async () => {
    const user = getContextUser()

    // cluster (root)
    //   plot (multiple)  <- base unit
    //     plot_details (single entity)
    //       plot_code (code)   <- old "common attribute": its immediate parent (plot_details) is NOT
    //                             selectable as phase 2 join entity, the walk up must reach "plot"
    //   other_branch (single entity, sibling of plot)
    //     other_code (code)    <- shares no ancestor relationship with the base unit except the root
    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', nodeDefType.integer).key(),
        SB.entity(
          'plot',
          SB.attribute('plot_id', nodeDefType.integer).key(),
          SB.entity('plot_details', SB.attribute('plot_code', nodeDefType.code).category('plot_code_cat'))
        ).multiple(),
        SB.entity('other_branch', SB.attribute('other_code', nodeDefType.code).category('plot_code_cat'))
      )
    )
      .categories(SB.category('plot_code_cat').levels('level1').items(SB.categoryItem('A'), SB.categoryItem('B')))
      .buildAndStore()

    const plotCodeDef = Survey.findNodeDefByName('plot_code')(survey)
    commonAttributeUuid = NodeDef.getUuid(plotCodeDef)
    siblingBranchAttributeUuid = NodeDef.getUuid(Survey.findNodeDefByName('other_code')(survey))
    rootEntityUuid = NodeDef.getUuid(Survey.findNodeDefByName('cluster')(survey))
    plotEntityUuid = NodeDef.getUuid(Survey.findNodeDefByName('plot')(survey))
    plotDetailsEntityUuid = NodeDef.getUuid(Survey.findNodeDefByName('plot_details')(survey))
    unknownAttributeUuid = uuidv4()

    const surveyId = Survey.getId(survey)

    chainWithOldPropsUuid = uuidv4()
    await ChainRepository.insertChain({
      surveyId,
      chain: {
        uuid: chainWithOldPropsUuid,
        props: {
          name: 'chain_with_old_props',
          [Chain.keysProps.samplingDesign]: {
            samplingStrategy: ChainSamplingDesign.samplingStrategies.twoPhase,
            [ChainSamplingDesign.keysProps.baseUnitNodeDefUuid]: plotEntityUuid,
            firstPhaseCategoryUuid: 'category-uuid-1',
            firstPhaseCategoryExtraProp: 'design_psu',
            firstPhaseCommonAttributeUuid: commonAttributeUuid,
          },
        },
      },
    })

    chainWithCategoryOnlyUuid = uuidv4()
    await ChainRepository.insertChain({
      surveyId,
      chain: {
        uuid: chainWithCategoryOnlyUuid,
        props: {
          name: 'chain_with_category_only',
          [Chain.keysProps.samplingDesign]: {
            samplingStrategy: ChainSamplingDesign.samplingStrategies.twoPhase,
            firstPhaseCategoryUuid: 'category-uuid-2',
            firstPhaseCategoryExtraProp: 'design_psu_2',
          },
        },
      },
    })

    chainWithoutOldPropsUuid = uuidv4()
    await ChainRepository.insertChain({
      surveyId,
      chain: {
        uuid: chainWithoutOldPropsUuid,
        props: {
          name: 'chain_without_old_props',
          [Chain.keysProps.samplingDesign]: {
            samplingStrategy: ChainSamplingDesign.samplingStrategies.simpleRandom,
          },
        },
      },
    })

    chainWithAttributeInSiblingBranchUuid = uuidv4()
    await ChainRepository.insertChain({
      surveyId,
      chain: {
        uuid: chainWithAttributeInSiblingBranchUuid,
        props: {
          name: 'chain_with_attribute_in_sibling_branch',
          [Chain.keysProps.samplingDesign]: {
            samplingStrategy: ChainSamplingDesign.samplingStrategies.twoPhase,
            [ChainSamplingDesign.keysProps.baseUnitNodeDefUuid]: plotEntityUuid,
            firstPhaseCommonAttributeUuid: siblingBranchAttributeUuid,
          },
        },
      },
    })

    chainWithUnknownAttributeUuid = uuidv4()
    await ChainRepository.insertChain({
      surveyId,
      chain: {
        uuid: chainWithUnknownAttributeUuid,
        props: {
          name: 'chain_with_unknown_attribute',
          [Chain.keysProps.samplingDesign]: {
            samplingStrategy: ChainSamplingDesign.samplingStrategies.twoPhase,
            [ChainSamplingDesign.keysProps.baseUnitNodeDefUuid]: plotEntityUuid,
            firstPhaseCommonAttributeUuid: unknownAttributeUuid,
          },
        },
      },
    })

    // Regression test for a real deadlock: at the point AllSurveysDataMigrationJob runs this step,
    // the survey's stored app_version is still OLD (it only gets stamped with the new version after
    // every step succeeds) -- so this migration must fetch the survey without going through
    // SurveyManager.fetchSurveyById's assertSurveyDataMigrated guard, or it throws
    // "survey.dataMigrationInProgress" while trying to migrate the very survey that needs it.
    await SurveyManager.updateSurveyAppVersion({ surveyId, version: '2.0.0' })

    await AnalysisManager.migrateSamplingDesignPhaseProps({ surveyId })
  })

  afterAll(async () => {
    if (survey) await SurveyManager.deleteSurvey(Survey.getId(survey))
  })

  const fetchMigratedSamplingDesign = async (chainUuid) => {
    const migratedChain = await ChainRepository.fetchChain({ surveyId: Survey.getId(survey), chainUuid })
    return Chain.getSamplingDesign(migratedChain)
  }

  test('migrates a chain with all three old props, backfilling the join entity walking up to the base unit', async () => {
    const samplingDesign = await fetchMigratedSamplingDesign(chainWithOldPropsUuid)

    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('category-uuid-1')
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBe('design_psu')
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBe(commonAttributeUuid)
    // the immediate parent entity (plot_details) is not selectable in the new selector:
    // the migration must have walked up to the base unit (plot)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).not.toBe(plotDetailsEntityUuid)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe(plotEntityUuid)
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(false)
    expect(samplingDesign.firstPhaseCategoryUuid).toBeUndefined()
    expect(samplingDesign.firstPhaseCategoryExtraProp).toBeUndefined()
    expect(samplingDesign.firstPhaseCommonAttributeUuid).toBeUndefined()
  })

  test('migrates a chain with only the category props set, leaving the join entity unset', async () => {
    const samplingDesign = await fetchMigratedSamplingDesign(chainWithCategoryOnlyUuid)

    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('category-uuid-2')
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBe('design_psu_2')
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBeUndefined()
  })

  test('leaves a chain without any old props untouched', async () => {
    const samplingDesign = await fetchMigratedSamplingDesign(chainWithoutOldPropsUuid)

    expect(samplingDesign).toEqual({ samplingStrategy: ChainSamplingDesign.samplingStrategies.simpleRandom })
  })

  test('falls back to the root entity when no ancestor of the attribute is related to the base unit', async () => {
    const samplingDesign = await fetchMigratedSamplingDesign(chainWithAttributeInSiblingBranchUuid)

    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBe(siblingBranchAttributeUuid)
    // "other_branch" is neither the base unit nor one of its ancestors, so it is skipped;
    // the root entity always qualifies, and is always accepted by the new selector
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe(rootEntityUuid)
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(false)
  })

  test('leaves the join entity unset when the common attribute does not exist in the survey', async () => {
    const samplingDesign = await fetchMigratedSamplingDesign(chainWithUnknownAttributeUuid)

    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBe(unknownAttributeUuid)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBeUndefined()
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(false)
    expect(samplingDesign.firstPhaseCommonAttributeUuid).toBeUndefined()
  })
})
