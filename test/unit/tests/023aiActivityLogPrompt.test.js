/**
 * Tests for the prompt builder used by the activity-log summarizer
 * (Tier 1 #5).
 */
import { buildActivityLogSummaryPrompt } from '@server/modules/ai/service/prompts/activityLogSummary'

describe('buildActivityLogSummaryPrompt', () => {
  test('emits a non-empty system prompt with style guidance', () => {
    const { system } = buildActivityLogSummaryPrompt({
      surveyName: 'forest_inventory',
      from: '2026-05-01T00:00:00Z',
      to: '2026-05-10T00:00:00Z',
      totalCount: 0,
      aggregates: [],
    })

    expect(system).toMatch(/Open Foris Arena/)
    expect(system).toMatch(/project manager/)
    expect(system).toMatch(/anomalies/)
    expect(system).toMatch(/do not invent/i)
  })

  test('user prompt echoes survey name, window and aggregates', () => {
    const { prompt } = buildActivityLogSummaryPrompt({
      surveyName: 'forest_inventory',
      from: '2026-05-01T00:00:00Z',
      to: '2026-05-10T00:00:00Z',
      totalCount: 42,
      aggregates: [
        { user: 'alice', type: 'recordCreate', count: 12, samples: ['2026-05-02T10:15:00'] },
        { user: 'bob', type: 'nodeDefUpdate', count: 5, samples: [] },
      ],
    })

    expect(prompt).toMatch(/forest_inventory/)
    expect(prompt).toMatch(/2026-05-01/)
    expect(prompt).toMatch(/2026-05-10/)
    expect(prompt).toMatch(/Total events: 42/)
    expect(prompt).toMatch(/alice/)
    expect(prompt).toMatch(/recordCreate/)
    expect(prompt).toMatch(/bob/)
    expect(prompt).toMatch(/nodeDefUpdate/)
  })

  test('handles empty aggregates with a no-events note', () => {
    const { prompt } = buildActivityLogSummaryPrompt({
      surveyName: 'empty',
      from: '2026-01-01',
      to: '2026-01-02',
      totalCount: 0,
      aggregates: [],
    })

    expect(prompt).toMatch(/no events in window/)
  })

  test('caps the aggregates block at 200 rows', () => {
    const big = Array.from({ length: 500 }, (_, i) => ({ user: `u${i}`, type: 't', count: 1, samples: [] }))
    const { prompt } = buildActivityLogSummaryPrompt({
      surveyName: 's',
      from: 'x',
      to: 'y',
      totalCount: 500,
      aggregates: big,
    })
    // Last 300 should not appear
    expect(prompt).toMatch(/u0\b/)
    expect(prompt).toMatch(/u199\b/)
    expect(prompt).not.toMatch(/u200\b/)
  })
})
