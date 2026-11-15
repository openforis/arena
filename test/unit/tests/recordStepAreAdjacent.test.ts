import * as RecordStep from '@core/record/recordStep'

const entry = RecordStep.getStep(RecordStep.entryCode)
const cleansing = RecordStep.getStep(RecordStep.cleansingCode)
const analysis = RecordStep.getStep(RecordStep.analysisCode)

describe('RecordStep.areAdjacent', () => {
  it('is true for consecutive steps, in both directions', () => {
    expect(RecordStep.areAdjacent(entry, cleansing)).toBe(true)
    expect(RecordStep.areAdjacent(cleansing, analysis)).toBe(true)
    expect(RecordStep.areAdjacent(analysis, cleansing)).toBe(true)
  })

  it('is false for the same step or non consecutive steps', () => {
    expect(RecordStep.areAdjacent(entry, entry)).toBe(false)
    expect(RecordStep.areAdjacent(entry, analysis)).toBe(false)
  })

  it('is false when a step is missing (e.g. unknown step id)', () => {
    expect(RecordStep.areAdjacent(entry, RecordStep.getStep('99'))).toBe(false)
    expect(RecordStep.areAdjacent(undefined, entry)).toBe(false)
    expect(RecordStep.areAdjacent(null, null)).toBe(false)
  })
})
