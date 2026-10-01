import { aggregateRecordsTotal } from '@webapp/views/App/views/Dashboard/utils/aggregateRecordsTotal'
import { filterActiveContributors } from '@webapp/views/App/views/Dashboard/utils/filterActiveContributors'
import { filterVisibleContributors } from '@webapp/views/App/views/Dashboard/utils/filterVisibleContributors'

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

describe('filterVisibleContributors', () => {
  const rows = [
    { owner_uuid: 'self', owner_email: 'me@x.com', count: '2' },
    { owner_uuid: 'other', owner_email: 'other@x.com', count: '5' },
  ]

  it('returns all rows when the viewer can see all users', () => {
    expect(filterVisibleContributors({ userCounts: rows, canViewAllUsers: true, currentUserUuid: 'self' })).toEqual(
      rows
    )
  })

  it('returns only the current user when the viewer cannot see all users', () => {
    expect(filterVisibleContributors({ userCounts: rows, canViewAllUsers: false, currentUserUuid: 'self' })).toEqual([
      rows[0],
    ])
  })

  it('returns empty when the current user uuid is missing', () => {
    expect(filterVisibleContributors({ userCounts: rows, canViewAllUsers: false, currentUserUuid: null })).toEqual([])
  })
})
