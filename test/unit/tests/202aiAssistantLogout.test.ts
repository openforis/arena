import { clearUserConversations } from '@webapp/ai/conversations/clearUserConversations'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { createMemoryConversationStore, getConversationStore } from '@webapp/ai/conversations/conversationStore'
import {
  createOpenConversations,
  getOpenConversationId,
  setOpenConversationId,
} from '@webapp/ai/conversations/openConversations'
import { createAssistantLogout, resetAssistantOnLogout } from '@webapp/components/ai/Assistant/assistantLogout'
import { assistantPanelStore, initialAssistantPanelState } from '@webapp/components/ai/Assistant/assistantPanelStore'

describe('assistant logout and clear conversations (202)', () => {
  test('logout stops the answers, waits for their saves, then resets the panel', async () => {
    const calls: string[] = []
    const logout = createAssistantLogout({
      abortTurns: () => {
        calls.push('abort')
      },
      settleSaves: async () => {
        await Promise.resolve()
        calls.push('settled')
      },
      resetPanel: () => {
        calls.push('reset')
      },
    })
    await logout()
    expect(calls).toEqual(['abort', 'settled', 'reset'])
  })

  test('logout keeps the conversations and the open ids of the user', async () => {
    // jest has no IndexedDB: the app store is the memory store, shared by the whole run (unique user uuid)
    const store = await getConversationStore()
    const conversation = createConversation({ userUuid: 'user-202', surveyId: 7, area: 'design' })
    await store.save(conversation)
    const key = { userUuid: 'user-202', surveyId: 7, area: 'design' }
    setOpenConversationId({ ...key, conversationId: conversation.id })
    assistantPanelStore.setScope({ userUuid: 'user-202', surveyId: 7 })

    await resetAssistantOnLogout()

    expect(await store.get(conversation.id)).not.toBeNull()
    expect(getOpenConversationId(key)).toBe(conversation.id)
    expect(assistantPanelStore.getState()).toEqual(initialAssistantPanelState)
  })

  test('clear conversations deletes the conversations and the open ids of the user only', async () => {
    const conversationStore = createMemoryConversationStore({ keep: 10 })
    const openConversations = createOpenConversations({ getStorage: () => null })
    const mine = createConversation({ userUuid: 'u1', surveyId: 7, area: 'design' })
    const theirs = createConversation({ userUuid: 'u2', surveyId: 7, area: 'design' })
    await conversationStore.save(mine)
    await conversationStore.save(theirs)
    openConversations.set({ userUuid: 'u1', surveyId: 7, area: 'design', conversationId: mine.id })
    openConversations.set({ userUuid: 'u2', surveyId: 7, area: 'design', conversationId: theirs.id })

    await clearUserConversations({ conversationStore, openConversations, userUuid: 'u1' })

    expect(await conversationStore.get(mine.id)).toBeNull()
    expect(openConversations.get({ userUuid: 'u1', surveyId: 7, area: 'design' })).toBeNull()
    expect(await conversationStore.get(theirs.id)).not.toBeNull()
    expect(openConversations.get({ userUuid: 'u2', surveyId: 7, area: 'design' })).toBe(theirs.id)
  })
})
