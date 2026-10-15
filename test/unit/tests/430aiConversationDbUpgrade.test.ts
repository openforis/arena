import { IDBFactory } from 'fake-indexeddb'

import { createConversation } from '@webapp/ai/conversations/conversationModel'
import {
  CONVERSATIONS_DB_NAME,
  ensureConversationsSchema,
  openConversationStore,
} from '@webapp/ai/conversations/conversationStore'

const openRaw = (factory: IDBFactory, version: number, onUpgrade: (request: IDBOpenDBRequest) => void) =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(CONVERSATIONS_DB_NAME, version)
    request.onupgradeneeded = () => onUpgrade(request)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

describe('conversation database upgrades (430)', () => {
  test('an upgrade of a database that already has the store does not create it again', async () => {
    const factory = new IDBFactory()
    const first = await openRaw(factory, 1, (request) =>
      ensureConversationsSchema(request.result, request.transaction as IDBTransaction)
    )
    first.close()
    // a later version: the store exists, creating it again would throw a ConstraintError and abort the upgrade
    const second = await openRaw(factory, 2, (request) =>
      ensureConversationsSchema(request.result, request.transaction as IDBTransaction)
    )
    const store = second.transaction('conversations').objectStore('conversations')
    expect([...store.indexNames].sort()).toEqual(['updatedAt', 'userSurvey', 'userUuid'])
    second.close()
  })

  test('an upgrade adds the indexes a store from an older version lacks', async () => {
    const factory = new IDBFactory()
    const first = await openRaw(factory, 1, (request) => {
      request.result.createObjectStore('conversations', { keyPath: 'id' })
    })
    first.close()
    const second = await openRaw(factory, 2, (request) =>
      ensureConversationsSchema(request.result, request.transaction as IDBTransaction)
    )
    const store = second.transaction('conversations').objectStore('conversations')
    expect([...store.indexNames].sort()).toEqual(['updatedAt', 'userSurvey', 'userUuid'])
    second.close()
  })

  test('the open connection is closed when another tab upgrades the database, so the upgrade is not blocked', async () => {
    const factory = new IDBFactory()
    const closed = jest.fn()
    const store = await openConversationStore({ indexedDB: factory, onClosed: closed })
    expect(store.persistent).toBe(true)
    await store.save(createConversation({ userUuid: 'u1', surveyId: 1, area: 'design', idFactory: () => 'c1' }))

    // another tab with a newer build asks for a higher version
    const upgraded = await Promise.race([
      openRaw(factory, 2, () => undefined).then((db) => {
        db.close()
        return true
      }),
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 1000)
      }),
    ])
    expect(upgraded).toBe(true)
    expect(closed).toHaveBeenCalledTimes(1)
  })
})
