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
  let commonAttributeUuid
  let plotEntityUuid

  beforeAll(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', nodeDefType.integer).key(),
        SB.entity(
          'plot',
          SB.attribute('plot_id', nodeDefType.integer).key(),
          SB.attribute('plot_code', nodeDefType.code).category('plot_code_cat')
        ).multiple()
      )
    )
      .categories(SB.category('plot_code_cat').levels('level1').items(SB.categoryItem('A'), SB.categoryItem('B')))
      .buildAndStore()

    const plotCodeDef = Survey.findNodeDefByName('plot_code')(survey)
    commonAttributeUuid = NodeDef.getUuid(plotCodeDef)
    plotEntityUuid = NodeDef.getUuid(Survey.findNodeDefByName('plot')(survey))

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

    await AnalysisManager.migrateSamplingDesignPhaseProps({ surveyId })
  })

  afterAll(async () => {
    if (survey) await SurveyManager.deleteSurvey(Survey.getId(survey))
  })

  test('migrates a chain with all three old props, backfilling the join entity from the common attribute parent', async () => {
    const migratedChain = await ChainRepository.fetchChain({
      surveyId: Survey.getId(survey),
      chainUuid: chainWithOldPropsUuid,
    })
    const samplingDesign = Chain.getSamplingDesign(migratedChain)

    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('category-uuid-1')
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBe('design_psu')
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBe(commonAttributeUuid)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe(plotEntityUuid)
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(false)
    expect(samplingDesign.firstPhaseCategoryUuid).toBeUndefined()
    expect(samplingDesign.firstPhaseCategoryExtraProp).toBeUndefined()
    expect(samplingDesign.firstPhaseCommonAttributeUuid).toBeUndefined()
  })

  test('migrates a chain with only the category props set, leaving the join entity unset', async () => {
    const migratedChain = await ChainRepository.fetchChain({
      surveyId: Survey.getId(survey),
      chainUuid: chainWithCategoryOnlyUuid,
    })
    const samplingDesign = Chain.getSamplingDesign(migratedChain)

    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('category-uuid-2')
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBe('design_psu_2')
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBeUndefined()
  })

  test('leaves a chain without any old props untouched', async () => {
    const migratedChain = await ChainRepository.fetchChain({
      surveyId: Survey.getId(survey),
      chainUuid: chainWithoutOldPropsUuid,
    })
    const samplingDesign = Chain.getSamplingDesign(migratedChain)

    expect(samplingDesign).toEqual({ samplingStrategy: ChainSamplingDesign.samplingStrategies.simpleRandom })
  })
})
