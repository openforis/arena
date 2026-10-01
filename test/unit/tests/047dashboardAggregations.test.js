import { aggregateRecordsTotal } from '@webapp/views/App/views/Dashboard/utils/aggregateRecordsTotal'
import { filterActiveContributors } from '@webapp/views/App/views/Dashboard/utils/filterActiveContributors'

describe('aggregateRecordsTotal', () => {
  it('sums count fields', () => {
    expect(aggregateRecordsTotal([{ count: '2' }, { count: 3 }])).toBe(5)
  })

  it('returns 0 for empty list', () => {
    expect(aggregateRecordsTotal([])).toBe(0)
  })
})

describe('filterActiveContributors', () => {
  it('keeps only contributors with count > 0', () => {
    const rows = [
      { owner_email: 'a@x.com', count: '2' },
      { owner_email: 'b@x.com', count: 0 },
    ]
    expect(filterActiveContributors(rows)).toEqual([{ owner_email: 'a@x.com', count: '2' }])
  })
})
