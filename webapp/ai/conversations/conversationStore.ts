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
  // null for an unknown id and for a conversation of another user (a shared browser)
  get: (id: string, userUuid: string) => Promise<Conversation | null>
  save: (conversation: Conversation) => Promise<void>
  remove: (id: string) => Promise<void>
  clearUser: (userUuid: string) => Promise<void>
  // the conversations of a deleted survey, of every user of this browser
  removeSurvey: (surveyId: number) => Promise<void>
}

export const CONVERSATIONS_DB_NAME = 'arena-ai'
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

const INDEXES: [name: string, keyPath: string | string[]][] = [
  ['userSurvey', ['userUuid', 'surveyKey']],
  ['userUuid', 'userUuid'],
  ['updatedAt', 'updatedAt'],
]

/**
 * Creates what is missing in the database: the store and its indexes. Creating a store that exists throws and aborts
 * the upgrade, so a version bump must find what an older version left.
 * @param {IDBDatabase} db - Database being upgraded.
 * @param {IDBTransaction} transaction - The version change transaction.
 * @returns {void}
 */
export const ensureConversationsSchema = (db: IDBDatabase, transaction: IDBTransaction): void => {
  const store = db.objectStoreNames.contains(STORE)
    ? transaction.objectStore(STORE)
    : db.createObjectStore(STORE, { keyPath: 'id' })
  for (const [name, keyPath] of INDEXES) {
    if (!store.indexNames.contains(name)) store.createIndex(name, keyPath)
  }
}

/**
 * Opens the database. When another tab (a newer build) asks for a new version, this connection is closed so that tab
 * is not blocked; the store is then reopened on the next use.
 * @param {IDBFactory} indexedDB - IndexedDB factory.
 * @param {Function} [onClosed] - Called when the connection was closed because another tab upgraded the database.
 * @returns {Promise<IDBDatabase>} The database.
 */
const openDatabase = (indexedDB: IDBFactory, onClosed?: () => void): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(CONVERSATIONS_DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      ensureConversationsSchema(request.result, request.transaction as IDBTransaction)
    }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => {
        db.close()
        onClosed?.()
      }
      resolve(db)
    }
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('The arena-ai database is blocked by another tab'))
  })

/**
 * Returns the ids of the conversations of a survey, whoever owns them (a key cursor: no conversation is loaded).
 * @param {IDBIndex} index - The userSurvey index (its keys are [userUuid, surveyKey]).
 * @param {number} surveyKey - Survey key.
 * @returns {Promise<string[]>} The conversation ids.
 */
const getPrimaryKeysOfSurvey = (index: IDBIndex, surveyKey: number): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const ids: string[] = []
    const request = index.openKeyCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) {
        resolve(ids)
        return
      }
      if ((cursor.key as [string, number])[1] === surveyKey) ids.push(cursor.primaryKey as string)
      cursor.continue()
    }
    request.onerror = () => reject(request.error)
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
    get: async (id, userUuid) => {
      const found = (await requestResult(db.transaction(STORE, 'readonly').objectStore(STORE).get(id))) as
        Conversation | undefined
      return found?.userUuid === userUuid ? found : null
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
    removeSurvey: async (surveyId) => {
      const index = db.transaction(STORE, 'readonly').objectStore(STORE).index('userSurvey')
      await removeAll(await getPrimaryKeysOfSurvey(index, toSurveyKey(surveyId)))
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
    get: async (id, userUuid) => {
      const found = byId.get(id)
      return found?.userUuid === userUuid ? structuredClone(found) : null
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
    removeSurvey: async (surveyId) => {
      for (const item of [...byId.values()]) {
        if (item.surveyKey === toSurveyKey(surveyId)) byId.delete(item.id)
      }
    },
  }
}

/**
 * Opens the conversation store.
 * @param {object} params - Parameters.
 * @param {IDBFactory|null} params.indexedDB - IndexedDB factory (null: memory store).
 * @param {number} [params.keep] - Conversations kept per user and survey.
 * @param {Function} [params.onClosed] - Called when the connection is closed because another tab upgraded the database.
 * @returns {Promise<ConversationStore>} The store.
 */
export const openConversationStore = async ({
  indexedDB,
  keep = AiLimits.assistantConversationsKept,
  onClosed,
}: {
  indexedDB: IDBFactory | null
  keep?: number
  onClosed?: () => void
}): Promise<ConversationStore> => {
  if (!indexedDB) return createMemoryConversationStore({ keep })
  try {
    return createIndexedDbStore(await openDatabase(indexedDB, onClosed), keep)
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
  appStorePromise ??= openConversationStore({
    indexedDB: globalThis.indexedDB ?? null,
    // the next use opens a fresh connection (the closed one is useless)
    onClosed: () => {
      appStorePromise = null
    },
  })
  return appStorePromise
}
