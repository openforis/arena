/**
 * Conversation storage in the browser: IndexedDB (arena-ai), or memory when IndexedDB is unavailable (private
 * windows, blocked storage). Nothing is sent to the server.
 */
import { AiLimits } from '@common/ai/limits'

import { logAiWarning, type AiLog } from '@webapp/ai/log/aiLog'

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
  // a conversation of another user is left alone (like get)
  remove: (id: string, userUuid: string) => Promise<void>
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
 * Opens the database. A newer build in another tab may have upgraded it past this build's version: that tab's version is
 * then used as it is (the store only needs what both builds share).
 * @param {IDBFactory} indexedDB - IndexedDB factory.
 * @returns {Promise<IDBDatabase>} The database.
 */
const openDatabase = (indexedDB: IDBFactory): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    /**
     * Opens the database at a version (any version when omitted).
     * @param {number} [version] - Version.
     * @returns {void}
     */
    const open = (version?: number): void => {
      const request =
        version === undefined ? indexedDB.open(CONVERSATIONS_DB_NAME) : indexedDB.open(CONVERSATIONS_DB_NAME, version)
      request.onupgradeneeded = () => {
        ensureConversationsSchema(request.result, request.transaction as IDBTransaction)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        if (version !== undefined && request.error?.name === 'VersionError') open()
        else reject(request.error)
      }
      request.onblocked = () => reject(new Error('The arena-ai database is blocked by another tab'))
    }
    open(DB_VERSION)
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
 * Creates the IndexedDB store. Retention runs in its own transaction after each save. When another tab upgrades the
 * database, the connection is closed (so that tab is not blocked) and the next call opens it again: whoever holds the
 * store keeps working.
 * @param {Function} open - Opens a connection.
 * @param {number} keep - Conversations kept per user and survey.
 * @returns {{ store: ConversationStore, ready: Promise<unknown> }} The store, and the first connection (it rejects when
 * the database cannot be opened).
 */
const createIndexedDbStore = (
  open: () => Promise<IDBDatabase>,
  keep: number
): { store: ConversationStore; ready: Promise<unknown> } => {
  let connection: Promise<IDBDatabase> | null = null
  const getDb = (): Promise<IDBDatabase> => {
    connection ??= open().then(
      (db) => {
        db.onversionchange = () => {
          db.close()
          connection = null
        }
        return db
      },
      (error: unknown) => {
        connection = null
        throw error
      }
    )
    return connection
  }
  /**
   * Runs work on the open connection; if it was closed in the meantime, once more on a new one.
   * @param {Function} work - Work on the database.
   * @returns {Promise<T>} The result.
   */
  const withDb = async <T>(work: (db: IDBDatabase) => Promise<T>): Promise<T> => {
    try {
      return await work(await getDb())
    } catch (error) {
      if ((error as Error)?.name !== 'InvalidStateError') throw error
      connection = null
      return work(await getDb())
    }
  }
  const list: ConversationStore['list'] = ({ userUuid, surveyId }) =>
    withDb(async (db) => {
      const index = db.transaction(STORE, 'readonly').objectStore(STORE).index('userSurvey')
      const conversations = (await requestResult(index.getAll([userUuid, toSurveyKey(surveyId)]))) as Conversation[]
      return conversations.sort(newestFirst)
    })
  const removeAll = (ids: string[]): Promise<void> =>
    ids.length === 0
      ? Promise.resolve()
      : withDb(async (db) => {
          const transaction = db.transaction(STORE, 'readwrite')
          const store = transaction.objectStore(STORE)
          for (const id of ids) store.delete(id)
          await transactionDone(transaction)
        })
  const store: ConversationStore = {
    persistent: true,
    list,
    get: (id, userUuid) =>
      withDb(async (db) => {
        const found = (await requestResult(db.transaction(STORE, 'readonly').objectStore(STORE).get(id))) as
          Conversation | undefined
        return found?.userUuid === userUuid ? found : null
      }),
    save: async (conversation) => {
      await withDb(async (db) => {
        const transaction = db.transaction(STORE, 'readwrite')
        transaction.objectStore(STORE).put(withSurveyKey(conversation))
        await transactionDone(transaction)
      })
      const all = await list(conversation)
      await removeAll(all.slice(keep).map((item) => item.id))
    },
    remove: (id, userUuid) =>
      withDb(async (db) => {
        const transaction = db.transaction(STORE, 'readwrite')
        const objects = transaction.objectStore(STORE)
        const request = objects.get(id)
        // inside the request callback, so the transaction is still active
        request.onsuccess = () => {
          if ((request.result as Conversation | undefined)?.userUuid === userUuid) objects.delete(id)
        }
        await transactionDone(transaction)
      }),
    clearUser: async (userUuid) => {
      const ids = await withDb(
        async (db) =>
          (await requestResult(
            db.transaction(STORE, 'readonly').objectStore(STORE).index('userUuid').getAllKeys(userUuid)
          )) as string[]
      )
      await removeAll(ids)
    },
    removeSurvey: async (surveyId) => {
      const ids = await withDb((db) =>
        getPrimaryKeysOfSurvey(
          db.transaction(STORE, 'readonly').objectStore(STORE).index('userSurvey'),
          toSurveyKey(surveyId)
        )
      )
      await removeAll(ids)
    },
  }
  return { store, ready: getDb() }
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
    remove: async (id, userUuid) => {
      if (byId.get(id)?.userUuid === userUuid) byId.delete(id)
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
 * @param {AiLog} [params.log] - Reports why the memory store is used.
 * @returns {Promise<ConversationStore>} The store.
 */
export const openConversationStore = async ({
  indexedDB,
  keep = AiLimits.assistantConversationsKept,
  log = logAiWarning,
}: {
  indexedDB: IDBFactory | null
  keep?: number
  log?: AiLog
}): Promise<ConversationStore> => {
  if (!indexedDB) return createMemoryConversationStore({ keep })
  try {
    const { store, ready } = createIndexedDbStore(() => openDatabase(indexedDB), keep)
    await ready
    return store
  } catch (error) {
    // private windows and blocked storage: keep working, the panel says it
    log('IndexedDB could not be opened; the conversations are kept in memory until the page reloads', error)
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
