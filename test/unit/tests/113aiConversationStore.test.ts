import { IDBFactory } from 'fake-indexeddb'

import { createConversation, toConversationTitle } from '@webapp/ai/conversations/conversationModel'
import { openConversationStore, type ConversationStore } from '@webapp/ai/conversations/conversationStore'
import type { Conversation } from '@webapp/ai/conversations/types'

const at = (seconds: number) => new Date(Date.UTC(2026, 9, 7, 10, 0, seconds))

let counter = 0
const conversation = ({
  seconds,
  userUuid = 'user-1',
  surveyId = 7 as number | null,
}: {
  seconds: number
  userUuid?: string
  surveyId?: number | null
}): Conversation => {
  counter += 1
  const created = createConversation({
    userUuid,
    surveyId,
    area: 'design',
    now: at(seconds),
    idFactory: () => `c${counter}`,
  })
  return {
    ...created,
    title: `t${seconds}`,
    messages: [{ id: 'm1', role: 'user', text: 'Add a remarks field', createdAt: created.createdAt }],
  }
}

const ids = (list: Conversation[]) => list.map((item) => item.id)

describe('conversation model', () => {
  test('createConversation: empty, schema class, surveyKey for IndexedDB', () => {
    expect(
      createConversation({ userUuid: 'u', surveyId: null, area: 'help', now: at(1), idFactory: () => 'x' })
    ).toEqual({
      id: 'x',
      userUuid: 'u',
      surveyId: null,
      surveyKey: 0,
      area: 'help',
      dataClass: 'schema',
      title: '',
      messages: [],
      changeSets: {},
      createdAt: '2026-10-07T10:00:01.000Z',
      updatedAt: '2026-10-07T10:00:01.000Z',
    })
  })

  test('toConversationTitle: first line, 60 characters at most', () => {
    expect(toConversationTitle('  Add a field\nwith details')).toBe('Add a field')
    expect(toConversationTitle('x'.repeat(80))).toBe(`${'x'.repeat(59)}…`)
  })
})

describe.each([
  ['IndexedDB', () => new IDBFactory() as unknown as IDBFactory, true],
  ['memory', () => null, false],
])('conversation store (%s)', (_name, createFactory, persistent) => {
  let store: ConversationStore

  beforeEach(async () => {
    store = await openConversationStore({ indexedDB: createFactory(), keep: 3 })
  })

  test('persistence flag', () => {
    expect(store.persistent).toBe(persistent)
  })

  test('list: the user and survey only, newest first', async () => {
    const a = conversation({ seconds: 1 })
    const b = conversation({ seconds: 3 })
    const c = conversation({ seconds: 2 })
    const noSurvey = conversation({ seconds: 2, surveyId: null })
    const otherUser = conversation({ seconds: 2, userUuid: 'user-2' })
    for (const item of [a, b, c, noSurvey, otherUser]) await store.save(item)
    expect(ids(await store.list({ userUuid: 'user-1', surveyId: 7 }))).toEqual([b.id, c.id, a.id])
    expect(ids(await store.list({ userUuid: 'user-1', surveyId: null }))).toEqual([noSurvey.id])
  })

  test('get returns a copy of what was saved; save replaces', async () => {
    const item = conversation({ seconds: 1 })
    await store.save(item)
    const loaded = await store.get(item.id)
    expect(loaded).toEqual(item)
    loaded!.title = 'changed in memory'
    expect((await store.get(item.id))!.title).toBe(item.title)
    await store.save({ ...item, title: 'renamed' })
    expect((await store.get(item.id))!.title).toBe('renamed')
    expect(await store.get('missing')).toBeNull()
  })

  test('retention keeps the newest conversations per user and survey', async () => {
    const saved = [1, 2, 3, 4].map((seconds) => conversation({ seconds }))
    const other = conversation({ seconds: 0, surveyId: 8 })
    for (const item of [other, ...saved]) await store.save(item)
    expect(ids(await store.list({ userUuid: 'user-1', surveyId: 7 }))).toEqual([saved[3].id, saved[2].id, saved[1].id])
    expect(await store.get(saved[0].id)).toBeNull()
    expect(await store.get(other.id)).not.toBeNull()
  })

  test('remove and clearUser', async () => {
    const mine = conversation({ seconds: 1 })
    const mineNoSurvey = conversation({ seconds: 2, surveyId: null })
    const theirs = conversation({ seconds: 3, userUuid: 'user-2' })
    for (const item of [mine, mineNoSurvey, theirs]) await store.save(item)
    await store.remove(mine.id)
    expect(await store.get(mine.id)).toBeNull()
    await store.clearUser('user-1')
    expect(await store.get(mineNoSurvey.id)).toBeNull()
    expect(await store.get(theirs.id)).not.toBeNull()
  })
})

describe('openConversationStore', () => {
  test('a factory that throws gives the memory store', async () => {
    const broken = {
      open: () => {
        throw new Error('SecurityError')
      },
    } as unknown as IDBFactory
    const store = await openConversationStore({ indexedDB: broken })
    expect(store.persistent).toBe(false)
    const item = conversation({ seconds: 1 })
    await store.save(item)
    expect(await store.get(item.id)).toEqual(item)
  })

  test('IndexedDB keeps the conversations when the store is opened again', async () => {
    const factory = new IDBFactory() as unknown as IDBFactory
    const item = conversation({ seconds: 1 })
    await (await openConversationStore({ indexedDB: factory })).save(item)
    expect(await (await openConversationStore({ indexedDB: factory })).get(item.id)).toEqual(item)
  })
})
