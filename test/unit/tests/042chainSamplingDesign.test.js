import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

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
