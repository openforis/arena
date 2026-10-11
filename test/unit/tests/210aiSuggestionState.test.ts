import {
  emptySuggestionState,
  getInProgressConversationIds,
  getPendingOf,
  getVisibleTargets,
  parseSuggestionState,
  selectVisible,
  withAdded,
  withDismissed,
  withKind,
  withModuleSeen,
  withoutSuggestion,
  withoutTargets,
  withProgress,
  withSettled,
  type SuggestionUserState,
  type VisibilityParams,
} from '@webapp/ai/suggestions/suggestionState'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

const NOW = new Date('2026-10-11T12:00:00.000Z')

const suggestion = (overrides: Partial<AssistantSuggestion> = {}): AssistantSuggestion => ({
  id: 'missingTranslations:fr',
  kind: 'missingTranslations',
  area: 'design',
  surveyId: 1,
  cycle: null,
  targets: [{ key: 'a:labels' }, { key: 'b:labels' }],
  createdAt: '2026-10-11T10:00:00.000Z',
  expiresAt: null,
  ...overrides,
})

const counted = (count: number): AssistantSuggestion =>
  suggestion({ id: 'validationErrors:0', kind: 'validationErrors', area: 'cleaning', targets: [{ key: '0', count }] })

const params = (overrides: Partial<VisibilityParams> = {}): VisibilityParams => ({
  surveyId: 1,
  cycle: '0',
  availableAreas: ['design', 'analysis', 'cleaning', 'help'],
  enabled: true,
  now: NOW,
  ...overrides,
})

const keysOf = (state: SuggestionUserState, overrides: Partial<VisibilityParams> = {}) =>
  selectVisible(state, params(overrides)).map((item) => [item.id, item.targets.map((target) => target.key)])

const withPending = (...suggestions: AssistantSuggestion[]): SuggestionUserState =>
  suggestions.reduce((state, item) => withAdded(state, item), emptySuggestionState())

describe('suggestion state rules (210)', () => {
  test('a missing, corrupt or wrongly shaped value parses as an empty state', () => {
    expect(parseSuggestionState(null)).toEqual(emptySuggestionState())
    expect(parseSuggestionState('{not json')).toEqual(emptySuggestionState())
    expect(parseSuggestionState('[1,2]')).toEqual(emptySuggestionState())
    const parsed = parseSuggestionState(
      JSON.stringify({
        pending: { 1: [suggestion(), { id: 3 }], 2: 'x', 3: [] },
        dismissed: { 1: { 'missingTranslations:fr': { 'a:labels': true, 'b:labels': 'no' } }, 2: {} },
        inProgress: { 1: { x: { conversationId: 'c1', targets: [{ key: 'a' }, { nokey: 1 }] }, y: { targets: [] } } },
        seenModules: ['designer', 4, 'designer'],
      })
    )
    expect(parsed).toEqual({
      pending: { 1: [suggestion()] },
      dismissed: { 1: { 'missingTranslations:fr': { 'a:labels': true } } },
      inProgress: { 1: { x: { conversationId: 'c1', targets: [{ key: 'a' }] } } },
      seenModules: ['designer'],
    })
  })

  test('a "__proto__" key in a stored value stays an own key and pollutes nothing', () => {
    const parsed = parseSuggestionState('{"pending":{"__proto__":[]},"dismissed":{"__proto__":{"x":{"k":true}}}}')
    expect(Object.getPrototypeOf(parsed.dismissed)).toBe(Object.prototype)
    expect(({} as Record<string, unknown>).x).toBeUndefined()
    expect(getPendingOf(parsed, '__proto__')).toEqual([])
  })

  test('withKind replaces the kind of one bucket and keeps the other kinds and buckets', () => {
    const other = suggestion({ id: 'entityWithoutKey:plot', kind: 'entityWithoutKey', targets: [{ key: 'p' }] })
    const otherSurvey = suggestion({ surveyId: 2 })
    let state = withPending(suggestion(), other, otherSurvey)
    state = withKind(state, {
      bucket: '1',
      kind: 'missingTranslations',
      suggestions: [suggestion({ id: 'missingTranslations:es', targets: [{ key: 'c:labels' }] })],
    })
    expect(getPendingOf(state, '1').map((item) => item.id)).toEqual(['entityWithoutKey:plot', 'missingTranslations:es'])
    expect(getPendingOf(state, '2')).toEqual([otherSurvey])
    expect(getPendingOf(withKind(state, { bucket: '1', kind: 'entityWithoutKey', suggestions: [] }), '1')).toHaveLength(
      1
    )
  })

  test('withKind prunes the dismissed and in-progress targets that left the gap', () => {
    let state = withPending(suggestion())
    state = withProgress(state, { bucket: '1', id: 'missingTranslations:fr', conversationId: 'c1' })
    state = withAdded(state, suggestion({ id: 'missingTranslations:es', targets: [{ key: 'x' }, { key: 'y' }] }))
    state = withDismissed(state, { bucket: '1', id: 'missingTranslations:es' })
    state = withKind(state, {
      bucket: '1',
      kind: 'missingTranslations',
      suggestions: [
        suggestion({ targets: [{ key: 'b:labels' }] }),
        suggestion({ id: 'missingTranslations:es', targets: [{ key: 'y' }] }),
      ],
    })
    expect(state.inProgress['1']['missingTranslations:fr'].targets).toEqual([{ key: 'b:labels' }])
    expect(state.dismissed['1']['missingTranslations:es']).toEqual({ y: true })
    state = withKind(state, { bucket: '1', kind: 'missingTranslations', suggestions: [] })
    expect(state).toEqual(emptySuggestionState())
  })

  test('withAdded merges a suggestion with the same id: targets united, a counted target takes the new count', () => {
    let state = withPending(counted(30))
    state = withAdded(state, {
      ...counted(45),
      createdAt: 'later',
      targets: [
        { key: '0', count: 45 },
        { key: '1', count: 2 },
      ],
    })
    const [merged] = getPendingOf(state, '1')
    expect(merged.createdAt).toBe('2026-10-11T10:00:00.000Z')
    expect(merged.targets).toEqual([
      { key: '0', count: 45 },
      { key: '1', count: 2 },
    ])
    expect(withAdded(state, suggestion({ targets: [] }))).toBe(state)
  })

  test('dismiss hides the visible targets; a new target shows again, alone', () => {
    let state = withPending(suggestion())
    state = withDismissed(state, { bucket: '1', id: 'missingTranslations:fr' })
    expect(keysOf(state)).toEqual([])
    state = withAdded(state, suggestion({ targets: [{ key: 'a:labels' }, { key: 'c:labels' }] }))
    expect(keysOf(state)).toEqual([['missingTranslations:fr', ['c:labels']]])
  })

  test('a dismissed counted target shows again only when it grew by the step (validation errors: 20)', () => {
    let state = withPending(counted(30))
    state = withDismissed(state, { bucket: '1', id: 'validationErrors:0' })
    expect(state.dismissed['1']['validationErrors:0']).toEqual({ 0: 30 })
    expect(keysOf(withAdded(state, counted(29)))).toEqual([])
    expect(keysOf(withAdded(state, counted(49)))).toEqual([])
    expect(keysOf(withAdded(state, counted(50)))).toEqual([['validationErrors:0', ['0']]])
    // a target without a step stays dismissed whatever its count
    const uncounted = withDismissed(withPending(suggestion({ targets: [{ key: 'a', count: 1 }] })), {
      bucket: '1',
      id: 'missingTranslations:fr',
    })
    expect(keysOf(withAdded(uncounted, suggestion({ targets: [{ key: 'a', count: 500 }] })))).toEqual([])
  })

  test('visibility: enabled, area, expiry, cycle and the Help bucket', () => {
    const help = suggestion({
      id: 'moduleIntro:designer',
      kind: 'moduleIntro',
      area: 'help',
      surveyId: null,
      targets: [{ key: 'designer' }],
    })
    const expiring = counted(30)
    const state = withPending(suggestion(), help, { ...expiring, cycle: '1', expiresAt: '2026-10-11T12:00:00.000Z' })
    expect(keysOf(state).map(([id]) => id)).toEqual(['missingTranslations:fr', 'moduleIntro:designer'])
    expect(keysOf(state, { enabled: false })).toEqual([])
    expect(keysOf(state, { availableAreas: ['help'] }).map(([id]) => id)).toEqual(['moduleIntro:designer'])
    expect(keysOf(state, { surveyId: null }).map(([id]) => id)).toEqual(['moduleIntro:designer'])
    const later = withPending({ ...expiring, cycle: '1', expiresAt: '2026-10-11T12:00:00.001Z' })
    expect(keysOf(later, { cycle: '1' }).map(([id]) => id)).toContain('validationErrors:0')
    expect(keysOf(later, { cycle: '0' }).map(([id]) => id)).not.toContain('validationErrors:0')
    expect(keysOf(state, { cycle: '1' }).map(([id]) => id)).not.toContain('validationErrors:0')
  })

  test('in progress hides the visible targets; settled dismisses those still in the gap, failed shows them again', () => {
    let state = withPending(suggestion())
    state = withProgress(state, { bucket: '1', id: 'missingTranslations:fr', conversationId: 'c1' })
    expect(keysOf(state)).toEqual([])
    expect(getPendingOf(state, '1')).toHaveLength(1)
    expect(getInProgressConversationIds(state)).toEqual(['c1'])
    const failed = withSettled(state, { conversationId: 'c1', outcome: 'failed' })
    expect(keysOf(failed)).toEqual([['missingTranslations:fr', ['a:labels', 'b:labels']]])
    // the assistant fixed a:labels: only b:labels is still in the gap
    const fixed = withoutTargets(state, { bucket: '1', id: 'missingTranslations:fr', targetKeys: ['a:labels'] })
    const settled = withSettled(fixed, { conversationId: 'c1', outcome: 'settled' })
    expect(settled.inProgress).toEqual({})
    expect(settled.dismissed['1']['missingTranslations:fr']).toEqual({ 'b:labels': true })
    expect(keysOf(withAdded(settled, suggestion()))).toEqual([['missingTranslations:fr', ['a:labels']]])
    expect(withSettled(state, { conversationId: 'other', outcome: 'settled' })).toEqual(state)
  })

  test('a second Do it adds its targets to the entry, which moves to the latest conversation', () => {
    let state = withPending(suggestion({ targets: [{ key: 'a' }] }))
    state = withProgress(state, { bucket: '1', id: 'missingTranslations:fr', conversationId: 'c1' })
    expect(withProgress(state, { bucket: '1', id: 'missingTranslations:fr', conversationId: 'c2' })).toBe(state)
    state = withAdded(state, suggestion({ targets: [{ key: 'b' }] }))
    state = withProgress(state, { bucket: '1', id: 'missingTranslations:fr', conversationId: 'c2' })
    expect(state.inProgress['1']['missingTranslations:fr']).toEqual({
      conversationId: 'c2',
      targets: [{ key: 'a' }, { key: 'b' }],
    })
  })

  test('remove drops the pending suggestion only: an in-progress target stays hidden after it is added again', () => {
    let state = withPending(suggestion())
    state = withProgress(state, { bucket: '1', id: 'missingTranslations:fr', conversationId: 'c1' })
    state = withoutSuggestion(state, { bucket: '1', id: 'missingTranslations:fr' })
    expect(getPendingOf(state, '1')).toEqual([])
    expect(getInProgressConversationIds(state)).toEqual(['c1'])
    expect(keysOf(withAdded(state, suggestion()))).toEqual([])
  })

  test('withoutTargets clears the targets from pending, in progress and dismissed', () => {
    let state = withPending(suggestion())
    state = withDismissed(state, { bucket: '1', id: 'missingTranslations:fr' })
    state = withAdded(state, suggestion())
    state = withoutTargets(state, { bucket: '1', id: 'missingTranslations:fr', targetKeys: ['a:labels', 'b:labels'] })
    expect(state).toEqual(emptySuggestionState())
  })

  test('module seen is recorded once', () => {
    const state = withModuleSeen(withModuleSeen(emptySuggestionState(), 'designer'), 'data')
    expect(state.seenModules).toEqual(['designer', 'data'])
    expect(withModuleSeen(state, 'designer')).toBe(state)
  })

  test('getVisibleTargets returns only the targets not dismissed and not in progress', () => {
    let state = withPending(suggestion({ targets: [{ key: 'a' }, { key: 'b' }, { key: 'c' }] }))
    state = withProgress(withoutTargets(state, { bucket: '1', id: 'missingTranslations:fr', targetKeys: ['b', 'c'] }), {
      bucket: '1',
      id: 'missingTranslations:fr',
      conversationId: 'c1',
    })
    const all = suggestion({ targets: [{ key: 'a' }, { key: 'b' }, { key: 'c' }] })
    expect(getVisibleTargets(state, all)).toEqual([{ key: 'b' }, { key: 'c' }])
  })
})
