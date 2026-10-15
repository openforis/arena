import { IDBFactory } from 'fake-indexeddb'

import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { openConversationStore, type ConversationStore } from '@webapp/ai/conversations/conversationStore'
import { createOpenConversations, type OpenConversationsStorage } from '@webapp/ai/conversations/openConversations'
import { createPurgeSurveyAiData } from '@webapp/ai/conversations/purgeSurveyAiData'
import { createSuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

const noLog = () => undefined

let counter = 0
const conversation = ({ userUuid, surveyId }: { userUuid: string; surveyId: number | null }) => {
  counter += 1
  return createConversation({ userUuid, surveyId, area: 'design', idFactory: () => `c${counter}` })
}

/** A Map-backed localStorage that lists its keys, like the browser's. */
const createFakeLocalStorage = () => {
  const data = new Map<string, string>()
  const storage: OpenConversationsStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size
    },
  }
  return { data, storage }
}

const suggestion = (surveyId: number | null): AssistantSuggestion => ({
  id: surveyId === null ? 'moduleIntro:designer' : 'missingTranslations:fr',
  kind: surveyId === null ? 'moduleIntro' : 'missingTranslations',
  area: surveyId === null ? 'help' : 'design',
  surveyId,
  cycle: null,
  targets: [{ key: 'a:labels' }],
  createdAt: '2026-10-11T10:00:00.000Z',
  expiresAt: null,
})

describe.each([
  ['IndexedDB', () => new IDBFactory() as unknown as IDBFactory],
  ['memory', () => null],
])('conversations of a shared browser (%s) (420)', (_name, createFactory) => {
  let store: ConversationStore

  beforeEach(async () => {
    store = await openConversationStore({ indexedDB: createFactory() })
  })

  test('get returns the conversation to its owner only', async () => {
    const mine = conversation({ userUuid: 'u1', surveyId: 7 })
    await store.save(mine)
    expect((await store.get(mine.id, 'u1'))?.id).toBe(mine.id)
    // another user who knows the id gets nothing
    expect(await store.get(mine.id, 'u2')).toBeNull()
    expect(await store.get(mine.id, '')).toBeNull()
  })

  test('removeSurvey deletes the survey conversations of every user and keeps the rest', async () => {
    const mine = conversation({ userUuid: 'u1', surveyId: 7 })
    const theirs = conversation({ userUuid: 'u2', surveyId: 7 })
    const otherSurvey = conversation({ userUuid: 'u1', surveyId: 8 })
    const noSurvey = conversation({ userUuid: 'u1', surveyId: null })
    for (const item of [mine, theirs, otherSurvey, noSurvey]) await store.save(item)

    await store.removeSurvey(7)

    expect(await store.get(mine.id, 'u1')).toBeNull()
    expect(await store.get(theirs.id, 'u2')).toBeNull()
    expect(await store.get(otherSurvey.id, 'u1')).not.toBeNull()
    expect(await store.get(noSurvey.id, 'u1')).not.toBeNull()
  })
})

describe('purge of a deleted survey (420)', () => {
  test('conversations, open ids and suggestions of the survey go, for every user; other surveys stay', async () => {
    const { storage } = createFakeLocalStorage()
    const conversations = await openConversationStore({ indexedDB: new IDBFactory() as unknown as IDBFactory })
    const openConversations = createOpenConversations({ getStorage: () => storage, log: noLog })
    const suggestions = createSuggestionStore({
      access: { getStorage: () => storage, addStorageListener: () => () => undefined },
      log: noLog,
    })
    const gone1 = conversation({ userUuid: 'u1', surveyId: 7 })
    const gone2 = conversation({ userUuid: 'u2', surveyId: 7 })
    const kept = conversation({ userUuid: 'u1', surveyId: 8 })
    for (const item of [gone1, gone2, kept]) await conversations.save(item)
    for (const [userUuid, item] of [
      ['u1', gone1],
      ['u2', gone2],
    ] as const) {
      openConversations.set({ userUuid, surveyId: 7, area: 'design', conversationId: item.id })
      suggestions.add({ userUuid, suggestion: suggestion(7) })
    }
    openConversations.set({ userUuid: 'u1', surveyId: 8, area: 'design', conversationId: kept.id })
    suggestions.add({ userUuid: 'u1', suggestion: suggestion(8) })
    suggestions.add({ userUuid: 'u1', suggestion: suggestion(null) })

    await createPurgeSurveyAiData({
      getConversationStore: async () => conversations,
      openConversations,
      suggestions,
      log: noLog,
    })(7)

    expect(await conversations.get(gone1.id, 'u1')).toBeNull()
    expect(await conversations.get(gone2.id, 'u2')).toBeNull()
    expect(await conversations.get(kept.id, 'u1')).not.toBeNull()
    for (const userUuid of ['u1', 'u2']) {
      expect(openConversations.get({ userUuid, surveyId: 7, area: 'design' })).toBeNull()
      expect(suggestions.getPending({ userUuid, surveyId: 7 })).toEqual([])
    }
    expect(openConversations.get({ userUuid: 'u1', surveyId: 8, area: 'design' })).toBe(kept.id)
    expect(suggestions.getPending({ userUuid: 'u1', surveyId: 8 })).toHaveLength(1)
    expect(suggestions.getPending({ userUuid: 'u1', surveyId: null })).toHaveLength(1)
  })

  test('a store that fails is logged, never thrown (the deletion of the survey goes on)', async () => {
    const log = jest.fn()
    const purge = createPurgeSurveyAiData({
      getConversationStore: async () => ({
        removeSurvey: async () => {
          throw new Error('blocked')
        },
      }),
      openConversations: { clearSurvey: jest.fn() },
      suggestions: { removeSurvey: jest.fn() },
      log,
    })
    await expect(purge(7)).resolves.toBeUndefined()
    expect(log).toHaveBeenCalledTimes(1)
  })
})
