import * as Record from '@core/record/record'

// the survey form calls these without a record or node (e.g. in the form designer)
describe('Record functions with missing record or node', () => {
  it('isInAnalysisStep is false without a record', () => {
    expect(Record.isInAnalysisStep(null)).toBe(false)
  })

  it('isNodeApplicable is true without a node', () => {
    expect(Record.isNodeApplicable(null)({ uuid: 'record', ownerName: '', ownerUuid: '', step: '1' })).toBe(true)
  })
})
