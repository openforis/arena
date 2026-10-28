import { IDBFactory } from 'fake-indexeddb'
import FDBIndex from 'fake-indexeddb/lib/FDBIndex'

import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { openConversationStore } from '@webapp/ai/conversations/conversationStore'

describe('conversation store retention (581)', () => {
  test('a save within the limit does not read the conversations', async () => {
    const store = await openConversationStore({ indexedDB: new IDBFactory(), keep: 2 })
    const getAll = jest.spyOn(FDBIndex.prototype, 'getAll')
    const make = (id: string) =>
      createConversation({ userUuid: 'u1', surveyId: 1, area: 'design', idFactory: () => id })
    await store.save(make('c1'))
    await store.save(make('c2'))
    expect(getAll).not.toHaveBeenCalled()
    await store.save(make('c3'))
    expect(getAll).toHaveBeenCalled()
    expect(await store.list({ userUuid: 'u1', surveyId: 1 })).toHaveLength(2)
    getAll.mockRestore()
  })
})
