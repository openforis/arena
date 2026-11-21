import { createOpenConversations } from '@webapp/ai/conversations/openConversations'
import { createAssistantPanelStore } from '@webapp/components/ai/Assistant/assistantPanelStore'
import { getStartScreenSuggestions } from '@webapp/components/ai/Assistant/suggestions/suggestionsModel'

const scope = { userUuid: 'user-248', surveyId: 7 }

const newStore = () => {
  const openConversations = createOpenConversations({ getStorage: () => null })
  const store = createAssistantPanelStore({ openConversations })
  store.setScope(scope)
  return { openConversations, store }
}

describe('assistant panel store: home, blank chat and lists (248)', () => {
  test('an area without an open conversation shows the home page, one with it shows the chat', () => {
    const { openConversations, store } = newStore()
    openConversations.set({ ...scope, area: 'design', conversationId: 'd1' })
    expect(store.getState().view).toBe('home')
    store.setArea('help')
    expect(store.getState()).toMatchObject({ view: 'home', conversationId: null })
    store.setArea('design')
    expect(store.getState()).toMatchObject({ view: 'chat', conversationId: 'd1' })
  })

  test('a new conversation is a blank chat and forgets the open one', () => {
    const { openConversations, store } = newStore()
    store.setArea('design')
    store.setConversationId('d1')
    store.startNewConversation()
    expect(store.getState()).toMatchObject({ view: 'chat', conversationId: null })
    expect(openConversations.get({ ...scope, area: 'design' })).toBeNull()
  })

  test('the blank chat stays when the same area is selected again', () => {
    const { store } = newStore()
    store.setArea('design')
    store.startNewConversation()
    store.setArea('design')
    expect(store.getState()).toMatchObject({ view: 'chat', conversationId: null })
  })

  test('home leaves the conversation: it is no longer the open one', () => {
    const { openConversations, store } = newStore()
    store.setArea('design')
    store.setConversationId('d1')
    store.showHome()
    expect(store.getState()).toMatchObject({ view: 'home', conversationId: null })
    expect(openConversations.get({ ...scope, area: 'design' })).toBeNull()
  })

  test('the conversation and suggestion lists are views of their own; a conversation shows the chat', () => {
    const { store } = newStore()
    store.setArea('design')
    store.showSuggestions()
    expect(store.getState().view).toBe('suggestions')
    store.showHistory()
    expect(store.getState().view).toBe('history')
    store.setConversationId('d2')
    expect(store.getState().view).toBe('chat')
    store.setConversationId(null)
    expect(store.getState().view).toBe('home')
  })

  test('closing the panel keeps the open conversation and drops the lists and the blank chat', () => {
    const { store } = newStore()
    store.setArea('design')
    store.open()
    store.setConversationId('d1')
    store.showHistory()
    store.close()
    expect(store.getState().view).toBe('chat')
    store.open()
    store.startNewConversation()
    store.toggle()
    expect(store.getState().view).toBe('home')
  })

  test('a scope change shows the chat of the restored conversation, or the home page', () => {
    const { openConversations, store } = newStore()
    openConversations.set({ userUuid: scope.userUuid, surveyId: 8, area: 'design', conversationId: 'd8' })
    store.setArea('design')
    store.showSuggestions()
    store.setScope({ userUuid: scope.userUuid, surveyId: 8 })
    expect(store.getState()).toMatchObject({ view: 'chat', conversationId: 'd8' })
    store.setScope({ userUuid: scope.userUuid, surveyId: 9 })
    expect(store.getState()).toMatchObject({ view: 'home', conversationId: null })
  })

  test('a draft and a Do it open a blank chat', () => {
    const { store } = newStore()
    store.openWithDraft({ area: 'cleaning', draft: 'Why?' })
    expect(store.getState()).toMatchObject({ view: 'chat', conversationId: null })
    store.showHome()
    store.startWithPrompt({ requestId: 'r1', area: 'design' } as any)
    expect(store.getState()).toMatchObject({ view: 'chat', conversationId: null })
  })
})

describe('start screen suggestions (248)', () => {
  const suggestions = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }) as any)

  test('the first three, and how many there are in all', () => {
    expect(getStartScreenSuggestions(suggestions)).toEqual({ shown: suggestions.slice(0, 3), total: 5 })
    expect(getStartScreenSuggestions(suggestions.slice(0, 2))).toEqual({ shown: suggestions.slice(0, 2), total: 2 })
  })
})
