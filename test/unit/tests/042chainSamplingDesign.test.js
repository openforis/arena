import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

const { samplingStrategies } = ChainSamplingDesign

describe('ChainSamplingDesign.phase1CategoryUuid', () => {
  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocPhase1CategoryUuid('cat-1')({})
    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('cat-1')
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase1CategoryUuid('cat-1')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBeUndefined()
  })
})

describe('ChainSamplingDesign.phase1JoinAttribute', () => {
  it('is undefined by default', () => {
    expect(ChainSamplingDesign.getPhase1JoinAttribute({})).toBeUndefined()
  })

  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocPhase1JoinAttribute('design_psu')({})
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBe('design_psu')
  })

  it('is enabled only when two-phase sampling is selected and sampling point data linkage is off', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const twoPhaseWithLinkage = { samplingStrategy: samplingStrategies.twoPhase, phase2AsSamplingPointData: true }
    const stratifiedRandom = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isPhase1JoinAttributeSelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isPhase1JoinAttributeSelectionEnabled(twoPhaseWithLinkage)).toBe(false)
    expect(ChainSamplingDesign.isPhase1JoinAttributeSelectionEnabled(stratifiedRandom)).toBe(false)
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase1JoinAttribute('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBeUndefined()
  })

  it('is cleared when the 1st phase category changes', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase, phase1CategoryUuid: 'cat-1' }
    samplingDesign = ChainSamplingDesign.assocPhase1JoinAttribute('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase1CategoryUuid('cat-2')(samplingDesign)
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBeUndefined()
    expect(ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)).toBe('cat-2')
  })

  it('is cleared when sampling point data linkage is turned on', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase1JoinAttribute('design_psu')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)(samplingDesign)
    expect(ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)).toBeUndefined()
  })
})

describe('ChainSamplingDesign.phase2JoinEntityUuid', () => {
  it('is undefined by default', () => {
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid({})).toBeUndefined()
  })

  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocPhase2JoinEntityUuid('entity-1')({})
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe('entity-1')
  })

  it('is enabled only when two-phase sampling is selected', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const stratifiedRandom = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isPhase2JoinEntitySelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isPhase2JoinEntitySelectionEnabled(stratifiedRandom)).toBe(false)
  })

  it('stays set when sampling point data linkage is turned on (only the join attributes are hidden, not the entity)', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinEntityUuid('entity-1')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe('entity-1')
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinEntityUuid('entity-1')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBeUndefined()
  })
})

describe('ChainSamplingDesign.phase2AsSamplingPointData', () => {
  it('is false by default', () => {
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData({})).toBe(false)
  })

  it('can be set and read back', () => {
    // starts from a two-phase design: assocPhase2AsSamplingPointData runs cleanupSamplingDesign,
    // which would immediately strip the flag again on a design where two-phase isn't selected
    const samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)({
      samplingStrategy: samplingStrategies.twoPhase,
    })
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(true)
  })

  it('is enabled only when two-phase sampling is selected', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const stratifiedRandom = { samplingStrategy: samplingStrategies.stratifiedRandom }
    expect(ChainSamplingDesign.isPhase2AsSamplingPointDataSelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isPhase2AsSamplingPointDataSelectionEnabled(stratifiedRandom)).toBe(false)
  })

  it('is cleared (reset to false) when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(false)
  })
})

describe('ChainSamplingDesign.phase2JoinAttribute', () => {
  it('is undefined by default', () => {
    expect(ChainSamplingDesign.getPhase2JoinAttribute({})).toBeUndefined()
  })

  it('can be set and read back', () => {
    const samplingDesign = ChainSamplingDesign.assocPhase2JoinAttribute('attr-uuid')({})
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBe('attr-uuid')
  })

  it('is enabled only when two-phase sampling is selected and sampling point data linkage is off', () => {
    const twoPhase = { samplingStrategy: samplingStrategies.twoPhase }
    const twoPhaseWithLinkage = { samplingStrategy: samplingStrategies.twoPhase, phase2AsSamplingPointData: true }
    expect(ChainSamplingDesign.isPhase2JoinAttributeSelectionEnabled(twoPhase)).toBe(true)
    expect(ChainSamplingDesign.isPhase2JoinAttributeSelectionEnabled(twoPhaseWithLinkage)).toBe(false)
  })

  it('is cleared when the phase 2 join entity changes', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase, phase2JoinEntityUuid: 'entity-1' }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinAttribute('attr-uuid')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase2JoinEntityUuid('entity-2')(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBeUndefined()
    expect(ChainSamplingDesign.getPhase2JoinEntityUuid(samplingDesign)).toBe('entity-2')
  })

  it('is cleared when sampling point data linkage is turned on', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinAttribute('attr-uuid')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocPhase2AsSamplingPointData(true)(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBeUndefined()
  })

  it('is cleared when sampling strategy changes away from two-phase', () => {
    let samplingDesign = { samplingStrategy: samplingStrategies.twoPhase }
    samplingDesign = ChainSamplingDesign.assocPhase2JoinAttribute('attr-uuid')(samplingDesign)
    samplingDesign = ChainSamplingDesign.assocSamplingStrategy(samplingStrategies.stratifiedRandom)(samplingDesign)
    expect(ChainSamplingDesign.getPhase2JoinAttribute(samplingDesign)).toBeUndefined()
  })
})
