import { createOpenConversations } from '@webapp/ai/conversations/openConversations'
import { createAssistantPanelStore } from '@webapp/components/ai/Assistant/assistantPanelStore'

const scope = { userUuid: 'user-201', surveyId: 7 }

const newStore = () => {
  const openConversations = createOpenConversations({ getStorage: () => null })
  return { openConversations, store: createAssistantPanelStore({ openConversations }) }
}

describe('assistant panel store: open conversations (201)', () => {
  test('setArea restores the open conversation of each area', () => {
    const { openConversations, store } = newStore()
    openConversations.set({ ...scope, area: 'design', conversationId: 'd1' })
    openConversations.set({ ...scope, area: 'help', conversationId: 'h1' })
    store.setScope(scope)
    store.setArea('design')
    expect(store.getState().conversationId).toBe('d1')
    store.setArea('help', { byUser: true })
    expect(store.getState().conversationId).toBe('h1')
    store.setArea('analysis')
    expect(store.getState().conversationId).toBeNull()
    store.setArea('design')
    expect(store.getState().conversationId).toBe('d1')
  })

  test('the conversation made current is remembered for its area, and null forgets it', () => {
    const { openConversations, store } = newStore()
    store.setScope(scope)
    store.setArea('design')
    store.setConversationId('d2')
    expect(openConversations.get({ ...scope, area: 'design' })).toBe('d2')
    store.setArea('help')
    expect(store.getState().conversationId).toBeNull()
    store.setArea('design')
    expect(store.getState().conversationId).toBe('d2')
    store.setConversationId(null)
    expect(openConversations.get({ ...scope, area: 'design' })).toBeNull()
  })

  test('without a scope nothing is restored or remembered', () => {
    const { openConversations, store } = newStore()
    openConversations.set({ ...scope, area: 'design', conversationId: 'd1' })
    store.setArea('design')
    expect(store.getState().conversationId).toBeNull()
    store.setConversationId('x')
    expect(openConversations.get({ ...scope, area: 'design' })).toBe('d1')
  })

  test('a scope set after the area restores that area (the panel host sets it on mount)', () => {
    const { openConversations, store } = newStore()
    openConversations.set({ ...scope, area: 'design', conversationId: 'd1' })
    store.setArea('design')
    store.setScope(scope)
    expect(store.getState().conversationId).toBe('d1')
  })

  test('another survey shows its own open conversation, the same scope changes nothing (review focus 5)', () => {
    const { openConversations, store } = newStore()
    openConversations.set({ ...scope, area: 'design', conversationId: 'd7' })
    openConversations.set({ userUuid: scope.userUuid, surveyId: 8, area: 'design', conversationId: 'd8' })
    store.setScope(scope)
    store.setArea('design')
    expect(store.getState().conversationId).toBe('d7')
    store.setScope({ userUuid: scope.userUuid, surveyId: 8 })
    expect(store.getState().conversationId).toBe('d8')

    let notified = 0
    store.subscribe(() => {
      notified += 1
    })
    store.setScope({ userUuid: scope.userUuid, surveyId: 8 })
    expect(notified).toBe(0)

    store.setScope({ userUuid: scope.userUuid, surveyId: 9 })
    expect(store.getState().conversationId).toBeNull()
    store.setScope(null)
    expect(store.getState().conversationId).toBeNull()
  })

  test('openWithDraft starts a new conversation and forgets the area open one', () => {
    const { openConversations, store } = newStore()
    openConversations.set({ ...scope, area: 'cleaning', conversationId: 'c1' })
    store.setScope(scope)
    store.setArea('cleaning')
    expect(store.getState().conversationId).toBe('c1')
    store.openWithDraft({ area: 'cleaning', draft: 'Why?' })
    expect(store.getState()).toMatchObject({ area: 'cleaning', conversationId: null, draft: 'Why?' })
    expect(openConversations.get({ ...scope, area: 'cleaning' })).toBeNull()
  })

  test('reset forgets the scope, not the stored ids', () => {
    const { openConversations, store } = newStore()
    store.setScope(scope)
    store.setArea('design')
    store.setConversationId('d1')
    store.reset()
    expect(store.getState()).toMatchObject({ scope: null, area: null, conversationId: null })
    expect(openConversations.get({ ...scope, area: 'design' })).toBe('d1')
  })
})
