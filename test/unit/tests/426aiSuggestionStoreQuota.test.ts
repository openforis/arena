import { createSuggestionStore, getSuggestionsKey } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

const userUuid = 'u1'
const KEY = getSuggestionsKey(userUuid)
const AREAS = ['design', 'analysis', 'cleaning', 'help'] as const

const suggestion = (overrides: Partial<AssistantSuggestion> = {}): AssistantSuggestion => ({
  id: 'missingTranslations:fr',
  kind: 'missingTranslations',
  area: 'design',
  surveyId: 1,
  cycle: null,
  targets: [{ key: 'a:labels' }],
  createdAt: '2026-10-11T10:00:00.000Z',
  expiresAt: null,
  ...overrides,
})

const targetsOf = (count: number) => Array.from({ length: count }, (_, index) => ({ key: `target-${index}` }))

/**
 * A storage that holds at most `limit` characters, and throws the browser's quota error beyond it.
 * @param {number} limit - Characters.
 * @returns {object} The storage and its map.
 */
const limitedStorage = (initialLimit: number) => {
  let limit = initialLimit
  const data = new Map<string, string>()
  const used = (except?: string) =>
    [...data].reduce((total, [key, value]) => (key === except ? total : total + key.length + value.length), 0)
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (used(key) + key.length + value.length > limit) {
        throw Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError', code: 22 })
      }
      data.set(key, value)
    },
    removeItem: (key: string) => data.delete(key),
  }
  return {
    data,
    storage,
    setLimit: (next: number) => {
      limit = next
    },
  }
}

const newStore = ({
  storage,
  now = () => new Date('2026-10-11T12:00:00.000Z'),
  log = jest.fn(),
}: {
  storage: ReturnType<typeof limitedStorage>['storage']
  now?: () => Date
  log?: jest.Mock
}) => ({
  log,
  store: createSuggestionStore({
    access: { getStorage: () => storage as unknown as Storage, addStorageListener: () => () => undefined },
    now,
    log,
  }),
})

describe('suggestion store: quota, expiry and the stored shape (426)', () => {
  test('a full storage: the state is pruned to fit, the write is retried and the pruning is logged', () => {
    const { data, storage } = limitedStorage(12_000)
    const { store, log } = newStore({ storage })
    for (let surveyId = 1; surveyId <= 15; surveyId += 1) {
      store.add({ userUuid, suggestion: suggestion({ surveyId, targets: targetsOf(100) }) })
    }
    expect((data.get(KEY) ?? '').length).toBeLessThanOrEqual(12_000)
    // the latest survey keeps its suggestion
    expect(store.getPending({ userUuid, surveyId: 15 }).length).toBe(1)
    expect(store.getPending({ userUuid, surveyId: 15 })[0].targets.length).toBeGreaterThan(0)
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/storage is full.*pruned/))
    expect(
      store.getVisible({ userUuid, surveyId: 15, cycle: null, availableAreas: [...AREAS], enabled: true })
    ).toHaveLength(1)
  })

  test('what does not fit even pruned stays in memory for the session, and the log says so', () => {
    const { storage } = limitedStorage(10)
    const { store, log } = newStore({ storage })
    store.add({ userUuid, suggestion: suggestion() })
    expect(store.getPending({ userUuid, surveyId: 1 })).toHaveLength(1)
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/storage is full.*memory/))
  })

  test('a write that succeeds later goes to the storage again', () => {
    const { data, storage, setLimit } = limitedStorage(10)
    const { store } = newStore({ storage })
    store.add({ userUuid, suggestion: suggestion() })
    expect(data.has(KEY)).toBe(false)
    setLimit(100_000)
    store.markModuleSeen({ userUuid, module: 'designer' })
    const stored = JSON.parse(data.get(KEY) ?? 'null')
    // nothing of the memory-only value was lost
    expect([stored.pending['1'].length, stored.seenModules]).toEqual([1, ['designer']])
  })

  test('every write drops the pending suggestions that expired', () => {
    const { data, storage } = limitedStorage(100_000)
    let clock = new Date('2026-10-11T12:00:00.000Z')
    const { store } = newStore({ storage, now: () => clock })
    store.add({
      userUuid,
      suggestion: suggestion({
        id: 'dataImported:latest',
        kind: 'dataImported',
        expiresAt: '2026-10-12T00:00:00.000Z',
      }),
    })
    store.add({ userUuid, suggestion: suggestion() })
    clock = new Date('2026-10-13T00:00:00.000Z')
    store.markModuleSeen({ userUuid, module: 'designer' })
    const stored = JSON.parse(data.get(KEY) ?? 'null')
    expect(stored.pending['1'].map((item: AssistantSuggestion) => item.id)).toEqual(['missingTranslations:fr'])
  })

  test('a state stored with the old shape is written back with the kind of each entry', () => {
    const { data, storage } = limitedStorage(100_000)
    data.set(
      KEY,
      JSON.stringify({
        pending: {},
        dismissed: { '1': { 'publishErrors:p': { 'a:labels': true } } },
        inProgress: {},
        seenModules: [],
      })
    )
    const { store } = newStore({ storage })
    store.markModuleSeen({ userUuid, module: 'designer' })
    expect(JSON.parse(data.get(KEY) ?? 'null').dismissed).toEqual({
      '1': { 'publishErrors:p': { kind: 'publishErrors', targets: { 'a:labels': true } } },
    })
  })

  test('a Dismiss that hits the quota stays dismissed; the dismissals of other surveys are what goes', () => {
    const { data, storage, setLimit } = limitedStorage(1_000_000)
    const state = {
      pending: Object.fromEntries(
        [1, 2, 3, 4, 5, 6].map((surveyId) => [
          String(surveyId),
          [suggestion({ surveyId, targets: targetsOf(surveyId === 6 ? 5 : 1) })],
        ])
      ),
      dismissed: Object.fromEntries(
        [1, 2, 3, 4, 5].map((surveyId) => [
          String(surveyId),
          { 'missingTranslations:fr': { kind: 'missingTranslations', targets: { old: 1, older: 1, oldest: 1 } } },
        ])
      ),
      inProgress: {},
      seenModules: [],
    }
    data.set(KEY, JSON.stringify(state))
    // the state with the new dismissal is about 1700 characters: it fits only once the dismissals of the other
    // surveys go (shrink level 2)
    setLimit(KEY.length + 1500)
    const { store, log } = newStore({ storage })
    store.dismiss({ userUuid, surveyId: 6, id: 'missingTranslations:fr' })
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/storage is full.*pruned/))
    expect(Object.keys(JSON.parse(data.get(KEY) as string).dismissed)).toEqual(['6'])
    const visible = store.getVisible({ userUuid, surveyId: 6, cycle: null, availableAreas: [...AREAS], enabled: true })
    expect(visible).toEqual([])
  })

  test('settling a conversation keeps the survey it settles, even when it is the oldest of more than 20', () => {
    const { data, storage } = limitedStorage(1_000_000)
    const surveyIds = Array.from({ length: 22 }, (_, index) => index + 1)
    data.set(
      KEY,
      JSON.stringify({
        pending: Object.fromEntries(
          surveyIds.map((surveyId) => [
            String(surveyId),
            [suggestion({ surveyId, targets: [{ key: 'a:labels' }, { key: 'b:labels' }] })],
          ])
        ),
        dismissed: {},
        inProgress: {
          '1': {
            'missingTranslations:fr': {
              kind: 'missingTranslations',
              conversationId: 'c1',
              targets: [{ key: 'a:labels' }],
            },
          },
        },
        seenModules: [],
      })
    )
    const { store } = newStore({ storage })
    store.onConversationSettled({ userUuid, conversationId: 'c1', outcome: 'settled' })
    const stored = JSON.parse(data.get(KEY) ?? 'null')
    expect(Object.keys(stored.pending)).toHaveLength(20)
    // the target not sent to the model stays pending in the survey of the conversation
    expect(stored.pending['1'][0].targets).toEqual([{ key: 'b:labels' }])
    expect(stored.dismissed['1']['missingTranslations:fr'].targets).toEqual({ 'a:labels': expect.anything() })
  })

  test('a corrupt stored state is reported once, however often it is read, and starts empty', () => {
    const { data, storage } = limitedStorage(100_000)
    data.set(KEY, '{"pending": oops')
    const { store, log } = newStore({ storage })
    expect(store.getPending({ userUuid, surveyId: 1 })).toEqual([])
    expect(store.getPending({ userUuid, surveyId: 1 })).toEqual([])
    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/corrupt.*dismissals are lost/), expect.any(Error))
    // the next write replaces it
    store.markModuleSeen({ userUuid, module: 'designer' })
    expect(JSON.parse(data.get(KEY) ?? 'null').seenModules).toEqual(['designer'])
    store.getPending({ userUuid, surveyId: 1 })
    expect(log).toHaveBeenCalledTimes(1)
  })
})
