import { getHeldLockNames, holdSuggestionTurnLock } from '@webapp/ai/suggestions/suggestionConversation'
import { reconcileInProgress } from '@webapp/ai/suggestions/reconcileInProgress'
import { createSuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

const NOW = new Date('2026-10-15T10:00:00Z')

const newStore = () =>
  createSuggestionStore({
    access: { getStorage: () => null, addStorageListener: () => () => undefined },
    now: () => NOW,
  })

const suggestion: AssistantSuggestion = {
  id: 'missingTranslations:fr',
  kind: 'missingTranslations',
  area: 'design',
  surveyId: 7,
  cycle: null,
  targets: [{ key: 'a:labels' }],
  createdAt: NOW.toISOString(),
  expiresAt: null,
}

describe('errors the suggestions recover from are logged (431)', () => {
  test('a lock that cannot be taken, by a sync throw or a rejection, is logged and never thrown', async () => {
    const log = jest.fn()
    const done = Promise.resolve()
    holdSuggestionTurnLock({
      conversationId: 'c1',
      done,
      locks: {
        request: () => {
          throw new Error('no locks')
        },
      },
      log,
    })
    holdSuggestionTurnLock({
      conversationId: 'c2',
      done,
      locks: { request: () => Promise.reject(new Error('refused')) } as unknown as Pick<LockManager, 'request'>,
      log,
    })
    await Promise.resolve()
    await Promise.resolve()
    expect(log).toHaveBeenCalledTimes(2)
  })

  test('without Web Locks nothing is held and nothing is logged', () => {
    const log = jest.fn()
    holdSuggestionTurnLock({ conversationId: 'c1', done: Promise.resolve(), locks: null, log })
    expect(log).not.toHaveBeenCalled()
  })

  test('a failing lock query gives no held names and is logged', async () => {
    const log = jest.fn()
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { locks: { query: () => Promise.reject(new Error('query failed')) } },
    })
    try {
      await expect(getHeldLockNames(log)).resolves.toEqual([])
    } finally {
      if (original) Object.defineProperty(globalThis, 'navigator', original)
      else delete (globalThis as { navigator?: unknown }).navigator
    }
    expect(log).toHaveBeenCalledTimes(1)
  })

  test('reconcile logs the lock names it could not list and goes on', async () => {
    const log = jest.fn()
    const store = newStore()
    store.add({ userUuid: 'u1', suggestion })
    store.startProgress({ userUuid: 'u1', surveyId: 7, id: suggestion.id, conversationId: 'c1' })
    await reconcileInProgress({
      store,
      userUuid: 'u1',
      load: async () => null,
      getHeldLockNames: () => Promise.reject(new Error('no query')),
      log,
    })
    expect(log).toHaveBeenCalledTimes(1)
    // the conversation is gone and no lock is known to hold it: the target shows again
    expect(store.getInProgressConversationIds('u1')).toEqual([])
  })
})
