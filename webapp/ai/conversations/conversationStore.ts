/**
 * Conversation storage in the browser: IndexedDB (arena-ai), or memory when IndexedDB is unavailable (private
 * windows, blocked storage). Nothing is sent to the server.
 */
import { AiLimits } from '@common/ai/limits'

import { toSurveyKey } from './conversationModel'
import type { Conversation } from './types'

export { toSurveyKey }

export type ConversationStore = {
  // false: the memory store (the panel says conversations are lost on reload)
  persistent: boolean
  list: (params: { userUuid: string; surveyId: number | null }) => Promise<Conversation[]>
  get: (id: string) => Promise<Conversation | null>
  save: (conversation: Conversation) => Promise<void>
  remove: (id: string) => Promise<void>
  clearUser: (userUuid: string) => Promise<void>
}

const DB_NAME = 'arena-ai'
const DB_VERSION = 1
const STORE = 'conversations'

const newestFirst = (a: Conversation, b: Conversation): number => b.updatedAt.localeCompare(a.updatedAt)

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'))
  })

const openDatabase = (indexedDB: IDBFactory): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: 'id' })
      store.createIndex('userSurvey', ['userUuid', 'surveyKey'])
      store.createIndex('userUuid', 'userUuid')
      store.createIndex('updatedAt', 'updatedAt')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('The arena-ai database is blocked by another tab'))
  })

const withSurveyKey = (conversation: Conversation): Conversation => ({
  ...conversation,
  surveyKey: toSurveyKey(conversation.surveyId),
})

/**
 * Creates the IndexedDB store. Retention runs in its own transaction after each save.
 * @param {IDBDatabase} db - Open database.
 * @param {number} keep - Conversations kept per user and survey.
 * @returns {ConversationStore} The store.
 */
const createIndexedDbStore = (db: IDBDatabase, keep: number): ConversationStore => {
  const list: ConversationStore['list'] = async ({ userUuid, surveyId }) => {
    const index = db.transaction(STORE, 'readonly').objectStore(STORE).index('userSurvey')
    const conversations = (await requestResult(index.getAll([userUuid, toSurveyKey(surveyId)]))) as Conversation[]
    return conversations.sort(newestFirst)
  }
  const removeAll = async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return
    const transaction = db.transaction(STORE, 'readwrite')
    const store = transaction.objectStore(STORE)
    for (const id of ids) store.delete(id)
    await transactionDone(transaction)
  }
  return {
    persistent: true,
    list,
    get: async (id) => {
      const found = await requestResult(db.transaction(STORE, 'readonly').objectStore(STORE).get(id))
      return (found as Conversation | undefined) ?? null
    },
    save: async (conversation) => {
      const transaction = db.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).put(withSurveyKey(conversation))
      await transactionDone(transaction)
      const all = await list(conversation)
      await removeAll(all.slice(keep).map((item) => item.id))
    },
    remove: (id) => removeAll([id]),
    clearUser: async (userUuid) => {
      const index = db.transaction(STORE, 'readonly').objectStore(STORE).index('userUuid')
      await removeAll((await requestResult(index.getAllKeys(userUuid))) as string[])
    },
  }
}

/**
 * Creates the in-memory store (same behaviour as IndexedDB, lost on reload).
 * @param {object} params - Parameters.
 * @param {number} params.keep - Conversations kept per user and survey.
 * @returns {ConversationStore} The store.
 */
export const createMemoryConversationStore = ({ keep }: { keep: number }): ConversationStore => {
  const byId = new Map<string, Conversation>()
  const list: ConversationStore['list'] = async ({ userUuid, surveyId }) =>
    [...byId.values()]
      .filter((item) => item.userUuid === userUuid && item.surveyKey === toSurveyKey(surveyId))
      .sort(newestFirst)
      .map((item) => structuredClone(item))
  return {
    persistent: false,
    list,
    get: async (id) => {
      const found = byId.get(id)
      return found ? structuredClone(found) : null
    },
    save: async (conversation) => {
      byId.set(conversation.id, structuredClone(withSurveyKey(conversation)))
      for (const old of (await list(conversation)).slice(keep)) byId.delete(old.id)
    },
    remove: async (id) => {
      byId.delete(id)
    },
    clearUser: async (userUuid) => {
      for (const item of [...byId.values()]) {
        if (item.userUuid === userUuid) byId.delete(item.id)
      }
    },
  }
}

/**
 * Opens the conversation store.
 * @param {object} params - Parameters.
 * @param {IDBFactory|null} params.indexedDB - IndexedDB factory (null: memory store).
 * @param {number} [params.keep] - Conversations kept per user and survey.
 * @returns {Promise<ConversationStore>} The store.
 */
export const openConversationStore = async ({
  indexedDB,
  keep = AiLimits.assistantConversationsKept,
}: {
  indexedDB: IDBFactory | null
  keep?: number
}): Promise<ConversationStore> => {
  if (!indexedDB) return createMemoryConversationStore({ keep })
  try {
    return createIndexedDbStore(await openDatabase(indexedDB), keep)
  } catch {
    // private windows and blocked storage: keep working, the panel says it
    return createMemoryConversationStore({ keep })
  }
}

let appStorePromise: Promise<ConversationStore> | null = null

/**
 * Returns the app's conversation store (opened once).
 * @returns {Promise<ConversationStore>} The store.
 */
export const getConversationStore = (): Promise<ConversationStore> => {
  appStorePromise ??= openConversationStore({ indexedDB: globalThis.indexedDB ?? null })
  return appStorePromise
}
