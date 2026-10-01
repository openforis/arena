import { aggregateRecordsTotal } from '@webapp/views/App/views/Dashboard/utils/aggregateRecordsTotal'

describe('aggregateRecordsTotal', () => {
  it('sums count fields', () => {
    expect(aggregateRecordsTotal([{ count: '2' }, { count: 3 }])).toBe(5)
  })

  it('returns 0 for empty list', () => {
    expect(aggregateRecordsTotal([])).toBe(0)
  })
})
