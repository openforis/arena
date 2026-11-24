import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

const { samplingStrategies } = ChainSamplingDesign

/**
 * `generateChainSummary` (server/modules/analysis/service/chainSummaryGenerator.js) gates the five
 * sampling design keys it writes into the R-facing summary JSON on these five predicates:
 *
 *   phase1Category             <- isPhase1CategorySelectionEnabled
 *   phase2JoinEntity           <- isPhase2JoinEntitySelectionEnabled
 *   phase2AsSamplingPointData  <- isPhase2AsSamplingPointDataSelectionEnabled
 *   phase1JoinAttribute        <- isPhase1JoinAttributeSelectionEnabled
 *   phase2JoinAttribute*       <- isPhase2JoinAttributeSelectionEnabled
 *
 * Since `generateChainSummary` needs a full survey + database to run, these tests pin down the exact
 * combination of predicate results the generator relies on, using plain sampling design fixtures.
 * If someone changes the semantics of any of these predicates, the corresponding output key would
 * silently appear/disappear from the summary JSON, and this test breaks loudly instead.
 */
describe('chainSummaryGenerator sampling design output gating', () => {
  const summaryKeysEnabled = (samplingDesign) => ({
    phase1Category: ChainSamplingDesign.isPhase1CategorySelectionEnabled(samplingDesign),
    phase2JoinEntity: ChainSamplingDesign.isPhase2JoinEntitySelectionEnabled(samplingDesign),
    phase2AsSamplingPointData: ChainSamplingDesign.isPhase2AsSamplingPointDataSelectionEnabled(samplingDesign),
    phase1JoinAttribute: ChainSamplingDesign.isPhase1JoinAttributeSelectionEnabled(samplingDesign),
    phase2JoinAttribute: ChainSamplingDesign.isPhase2JoinAttributeSelectionEnabled(samplingDesign),
  })

  it('writes every phase key for a two-phase design with the sampling point data linkage off', () => {
    const samplingDesign = {
      [ChainSamplingDesign.keysProps.samplingStrategy]: samplingStrategies.twoPhase,
      [ChainSamplingDesign.keysProps.phase1CategoryUuid]: 'cat-1',
      [ChainSamplingDesign.keysProps.phase1JoinAttribute]: 'design_psu',
      [ChainSamplingDesign.keysProps.phase2JoinEntityUuid]: 'entity-1',
      [ChainSamplingDesign.keysProps.phase2JoinAttribute]: 'attr-1',
      [ChainSamplingDesign.keysProps.phase2AsSamplingPointData]: false,
    }
    expect(summaryKeysEnabled(samplingDesign)).toEqual({
      phase1Category: true,
      phase2JoinEntity: true,
      phase2AsSamplingPointData: true,
      phase1JoinAttribute: true,
      phase2JoinAttribute: true,
    })
  })

  it('omits both join attribute keys for a two-phase design with the sampling point data linkage on', () => {
    const samplingDesign = {
      [ChainSamplingDesign.keysProps.samplingStrategy]: samplingStrategies.twoPhase,
      [ChainSamplingDesign.keysProps.phase1CategoryUuid]: 'cat-1',
      [ChainSamplingDesign.keysProps.phase2JoinEntityUuid]: 'entity-1',
      [ChainSamplingDesign.keysProps.phase2AsSamplingPointData]: true,
    }
    expect(summaryKeysEnabled(samplingDesign)).toEqual({
      phase1Category: true,
      phase2JoinEntity: true,
      phase2AsSamplingPointData: true,
      phase1JoinAttribute: false,
      phase2JoinAttribute: false,
    })
    // the flag itself is still written out, with value true
    expect(ChainSamplingDesign.isPhase2AsSamplingPointData(samplingDesign)).toBe(true)
  })

  it('omits every phase key for a non two-phase design', () => {
    const nonTwoPhaseStrategies = Object.values(samplingStrategies).filter(
      (strategy) => strategy !== samplingStrategies.twoPhase
    )
    expect(nonTwoPhaseStrategies.length).toBeGreaterThan(0)

    nonTwoPhaseStrategies.forEach((samplingStrategy) => {
      expect(summaryKeysEnabled({ [ChainSamplingDesign.keysProps.samplingStrategy]: samplingStrategy })).toEqual({
        phase1Category: false,
        phase2JoinEntity: false,
        phase2AsSamplingPointData: false,
        phase1JoinAttribute: false,
        phase2JoinAttribute: false,
      })
    })
  })

  it('omits every phase key when no sampling strategy is specified', () => {
    expect(summaryKeysEnabled({})).toEqual({
      phase1Category: false,
      phase2JoinEntity: false,
      phase2AsSamplingPointData: false,
      phase1JoinAttribute: false,
      phase2JoinAttribute: false,
    })
  })
})
