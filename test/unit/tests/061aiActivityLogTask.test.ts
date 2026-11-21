import { aggregateActivityLogEntries, buildActivityLogSummaryRequest } from '@common/ai/tasks/activityLog'

const entry = (userName: string, type: string, dateCreated: string) => ({
  userName,
  userUuid: `${userName}-uuid`,
  type,
  dateCreated,
})

describe('aggregateActivityLogEntries', () => {
  test('groups by user and type, sorted by count, with up to 3 samples', () => {
    const entries = [
      entry('ann', 'recordCreate', '2026-05-01T10:00:00Z'),
      entry('bob', 'nodeDefUpdate', '2026-05-01T11:00:00Z'),
      entry('ann', 'recordCreate', '2026-05-02T10:00:00Z'),
      entry('ann', 'recordCreate', '2026-05-03T10:00:00Z'),
      entry('ann', 'recordCreate', '2026-05-04T10:00:00Z'),
    ]
    const [first, second] = aggregateActivityLogEntries(entries)
    expect(first).toEqual({
      user: 'ann',
      type: 'recordCreate',
      count: 4,
      samples: ['2026-05-01T10:00:00', '2026-05-02T10:00:00', '2026-05-03T10:00:00'],
    })
    expect(second.count).toBe(1)
  })

  test('truncates long user names and types to 64 chars', () => {
    const [row] = aggregateActivityLogEntries([entry('u'.repeat(100), 't'.repeat(100), '2026-05-01T10:00:00Z')])
    expect(row.user).toHaveLength(64)
    expect(row.type).toHaveLength(64)
  })
})

describe('buildActivityLogSummaryRequest', () => {
  test('uses the oldest and newest entry dates as the window', () => {
    const { prompt } = buildActivityLogSummaryRequest({
      surveyName: 'forest',
      entries: [
        entry('ann', 'recordCreate', '2026-05-03T10:00:00Z'),
        entry('bob', 'recordCreate', '2026-05-01T10:00:00Z'),
      ],
    })
    expect(prompt).toMatch(/2026-05-01T10:00:00.000Z/)
    expect(prompt).toMatch(/2026-05-03T10:00:00.000Z/)
    expect(prompt).toMatch(/forest/)
  })

  test('handles an empty log', () => {
    const { prompt } = buildActivityLogSummaryRequest({ surveyName: 'forest', entries: [] })
    expect(prompt).toMatch(/beginning/)
  })
})
