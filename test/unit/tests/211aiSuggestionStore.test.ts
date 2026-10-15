import {
  createSuggestionStore,
  getSuggestionsKey,
  isSuggestionsKey,
  type SuggestionStorageAccess,
} from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

const noLog = () => undefined
const NOW = new Date('2026-10-11T12:00:00.000Z')
const AREAS = ['design', 'analysis', 'cleaning', 'help'] as const

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

const visible = (store: ReturnType<typeof createSuggestionStore>, userUuid = 'u1', surveyId: number | null = 1) =>
  store.getVisible({ userUuid, surveyId, cycle: '0', availableAreas: [...AREAS], enabled: true })

/**
 * A Map-backed Storage shared by the "tabs" of one test; a write fires the storage event in the other tabs.
 */
const createBrowser = () => {
  const data = new Map<string, string>()
  const listeners: { tab: number; listener: (key: string | null) => void }[] = []
  let writingTab = 0
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
      for (const entry of listeners) if (entry.tab !== writingTab) entry.listener(key)
    },
    removeItem: (key: string) => {
      data.delete(key)
      for (const entry of listeners) if (entry.tab !== writingTab) entry.listener(key)
    },
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage
  const tab = (id: number) => {
    const access: SuggestionStorageAccess = {
      getStorage: () => {
        writingTab = id
        return storage
      },
      addStorageListener: (listener) => {
        const entry = { tab: id, listener }
        listeners.push(entry)
        return () => listeners.splice(listeners.indexOf(entry), 1)
      },
    }
    return createSuggestionStore({ access, now: () => NOW, log: noLog })
  }
  return { data, storage, tab }
}

const memoryAccess = (getStorage: () => Storage | null): SuggestionStorageAccess => ({
  getStorage,
  addStorageListener: () => () => undefined,
})

describe('suggestion store (211)', () => {
  test('keys: one per user, and the storage events it reacts to', () => {
    expect(getSuggestionsKey('u1')).toBe('arena.ai.suggestions.u1')
    expect(isSuggestionsKey('arena.ai.suggestions.u2')).toBe(true)
    expect(isSuggestionsKey(null)).toBe(true)
    expect(isSuggestionsKey('arena.ai.openConversations.u1')).toBe(false)
  })

  test('a mutation is written to the user key and notifies; no change, no write and no notification', () => {
    const { data, tab } = createBrowser()
    const store = tab(1)
    const listener = jest.fn()
    store.subscribe(listener)
    store.setKind({ userUuid: 'u1', surveyId: 1, kind: 'missingTranslations', suggestions: [suggestion()] })
    expect(JSON.parse(data.get('arena.ai.suggestions.u1') ?? '{}').pending['1']).toHaveLength(1)
    expect(listener).toHaveBeenCalledTimes(1)
    store.setKind({ userUuid: 'u1', surveyId: 1, kind: 'missingTranslations', suggestions: [suggestion()] })
    store.dismiss({ userUuid: 'u1', surveyId: 1, id: 'unknown' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(visible(store).map((item) => item.id)).toEqual(['missingTranslations:fr'])
    expect(visible(store, 'u2')).toEqual([])
    expect(visible(store, 'u1', 2)).toEqual([])
  })

  test('two tabs: a write in one notifies the other, which reads the new state; Clear is seen too', () => {
    const { tab } = createBrowser()
    const first = tab(1)
    const second = tab(2)
    const secondListener = jest.fn()
    second.subscribe(secondListener)
    first.add({ userUuid: 'u1', suggestion: suggestion() })
    expect(secondListener).toHaveBeenCalledTimes(1)
    expect(visible(second)).toHaveLength(1)
    // each mutation re-reads the key: the second tab's dismissal keeps the first tab's later addition
    first.add({ userUuid: 'u1', suggestion: suggestion({ id: 'entityWithoutKey:plot', kind: 'entityWithoutKey' }) })
    second.dismiss({ userUuid: 'u1', surveyId: 1, id: 'missingTranslations:fr' })
    expect(visible(first).map((item) => item.id)).toEqual(['entityWithoutKey:plot'])
    // two additions seen through the event, the second tab's own dismissal, then the Clear of the first tab
    first.clearUser('u1')
    expect(secondListener).toHaveBeenCalledTimes(4)
    expect(visible(second)).toEqual([])
  })

  test('blocked storage: the store works in memory and never throws', () => {
    const store = createSuggestionStore({
      access: memoryAccess(() => {
        throw new Error('SecurityError')
      }),
      now: () => NOW,
      log: noLog,
    })
    store.add({ userUuid: 'u1', suggestion: suggestion() })
    expect(visible(store)).toHaveLength(1)
    store.markModuleSeen({ userUuid: 'u1', module: 'designer' })
    expect(store.isModuleSeen({ userUuid: 'u1', module: 'designer' })).toBe(true)
    store.clearUser('u1')
    expect(visible(store)).toEqual([])
  })

  test('full storage (setItem throws): the memory copy is the truth for the session', () => {
    const data = new Map<string, string>()
    const full = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: (key: string) => data.delete(key),
    } as unknown as Storage
    const store = createSuggestionStore({ access: memoryAccess(() => full), now: () => NOW, log: noLog })
    store.add({ userUuid: 'u1', suggestion: suggestion() })
    store.dismiss({ userUuid: 'u1', surveyId: 1, id: 'missingTranslations:fr' })
    store.add({ userUuid: 'u1', suggestion: suggestion({ targets: [{ key: 'c:labels' }] }) })
    expect(visible(store)[0].targets).toEqual([{ key: 'c:labels' }])
    expect(data.size).toBe(0)
  })

  test('Clear after a failed write also removes the older stored value', () => {
    const key = getSuggestionsKey('u1')
    const data = new Map<string, string>([
      [key, JSON.stringify({ pending: {}, dismissed: {}, inProgress: {}, seenModules: [] })],
    ])
    const full = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: (k: string) => data.delete(k),
    } as unknown as Storage
    const store = createSuggestionStore({ access: memoryAccess(() => full), now: () => NOW, log: noLog })
    store.add({ userUuid: 'u1', suggestion: suggestion() })
    expect(data.has(key)).toBe(true)
    store.clearUser('u1')
    expect(data.has(key)).toBe(false)
    expect(visible(store)).toEqual([])
  })

  test('no storage at all (getStorage returns null): memory', () => {
    const store = createSuggestionStore({ access: memoryAccess(() => null), now: () => NOW, log: noLog })
    store.add({ userUuid: 'u1', suggestion: suggestion() })
    expect(store.getPending({ userUuid: 'u1', surveyId: 1 })).toHaveLength(1)
  })

  test('a corrupt stored value reads as empty and is replaced on the next write', () => {
    const { data, tab } = createBrowser()
    data.set('arena.ai.suggestions.u1', '{"pending":')
    const store = tab(1)
    expect(visible(store)).toEqual([])
    store.add({ userUuid: 'u1', suggestion: suggestion() })
    expect(JSON.parse(data.get('arena.ai.suggestions.u1') ?? '').pending['1']).toHaveLength(1)
  })

  test('Do it and settle through the store: in progress, then failed shows again, settled dismisses', () => {
    const { tab } = createBrowser()
    const store = tab(1)
    store.add({ userUuid: 'u1', suggestion: suggestion() })
    store.startProgress({ userUuid: 'u1', surveyId: 1, id: 'missingTranslations:fr', conversationId: 'c1' })
    expect(visible(store)).toEqual([])
    expect(store.getInProgressConversationIds('u1')).toEqual(['c1'])
    store.onConversationSettled({ userUuid: 'u1', conversationId: 'c1', outcome: 'failed' })
    expect(visible(store)).toHaveLength(1)
    store.startProgress({ userUuid: 'u1', surveyId: 1, id: 'missingTranslations:fr', conversationId: 'c2' })
    store.removeTargets({ userUuid: 'u1', surveyId: 1, id: 'missingTranslations:fr', targetKeys: ['a:labels'] })
    store.onConversationSettled({ userUuid: 'u1', conversationId: 'c2', outcome: 'settled' })
    expect(store.getInProgressConversationIds('u1')).toEqual([])
    store.add({ userUuid: 'u1', suggestion: suggestion() })
    expect(visible(store)[0].targets).toEqual([{ key: 'a:labels' }])
    store.remove({ userUuid: 'u1', surveyId: 1, id: 'missingTranslations:fr' })
    expect(store.getPending({ userUuid: 'u1', surveyId: 1 })).toEqual([])
  })

  test('an expired suggestion is hidden at the injected time', () => {
    const { tab } = createBrowser()
    const store = tab(1)
    store.add({ userUuid: 'u1', suggestion: suggestion({ expiresAt: '2026-10-11T12:00:00.000Z' }) })
    expect(visible(store)).toEqual([])
    expect(store.getPending({ userUuid: 'u1', surveyId: 1 })).toHaveLength(1)
  })
})
