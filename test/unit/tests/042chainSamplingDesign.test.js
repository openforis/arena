import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import { buildSurveyWithBaseUnit } from '@test/unit/tests/utils/chainSamplingDesignFixtures'

const { samplingStrategies } = ChainSamplingDesign

describe('ChainSamplingDesign.firstPhaseCategoryExtraProp', () => {
  it('is undefined by default', () => {
    const samplingDesign = {}
    expect(ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)).toBeUndefined()
  })

  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocFirstPhaseCategoryExtraProp('design_psu')({})
    expect(ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)).toBe('design_psu')
  })

  it('is enabled only when two-phase sampling is selected', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const stratifiedRandom = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isFirstPhaseCategoryExtraPropSelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isFirstPhaseCategoryExtraPropSelectionEnabled(stratifiedRandom)).toBe(false)
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocFirstPhaseCategoryExtraProp('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)).toBeUndefined()
  })

  it('is cleared when the 1st phase category changes', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase, firstPhaseCategoryUuid: 'cat-1' }
    samplingDesign = ChainSamplingDesign.assocFirstPhaseCategoryExtraProp('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocFirstPhaseCategoryUuid('cat-2')(samplingDesign)
    expect(ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)).toBeUndefined()
    expect(ChainSamplingDesign.getFirstPhaseCategoryUuid(samplingDesign)).toBe('cat-2')
  })
})

describe('ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod', () => {
  it('is true when the base unit key attribute is a code attribute on the sampling_point_data category', () => {
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    expect(ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef })).toBe(true)
  })

  it('is false when the base unit key attribute is a code attribute on a different category', () => {
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    expect(ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef })).toBe(false)
  })

  it('is false when there is no base unit', () => {
    const { survey } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    expect(ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef: null })).toBe(false)
  })

  it('is false when the base unit key attribute is on the sampling_point_data category but is not a code attribute', () => {
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({
      baseUnitKeyIsSamplingPointData: true,
      baseUnitKeyIsCode: false,
    })
    expect(ChainSamplingDesign.isFirstPhaseSamplingPointDataJoinMethod({ survey, baseUnitNodeDef })).toBe(false)
  })
})

describe('ChainSamplingDesign.isFirstPhaseCommonAttributeRequired', () => {
  it('is true for two-phase sampling with a base unit not keyed by sampling_point_data', () => {
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    expect(ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef })).toBe(
      true
    )
  })

  it('is false for two-phase sampling with a base unit keyed by sampling_point_data', () => {
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    const samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    expect(ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef })).toBe(
      false
    )
  })

  it('is false when sampling strategy is not two-phase, regardless of base unit', () => {
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const samplingDesign = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef })).toBe(
      false
    )
  })

  it('is false when sampling strategy is not two-phase, even with a base unit keyed by sampling_point_data', () => {
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    const samplingDesign = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef })).toBe(
      false
    )
  })

  it('is false for two-phase sampling with no base unit selected', () => {
    const { survey } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    expect(
      ChainSamplingDesign.isFirstPhaseCommonAttributeRequired({ samplingDesign, survey, baseUnitNodeDef: null })
    ).toBe(false)
  })
})
