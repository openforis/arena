import { buildHistory } from '@webapp/ai/agent/agentMessages'
import { createTurnState } from '@webapp/ai/agent/turnState'
import type { ChangeSet, ChangeSetCardState } from '@webapp/ai/changeSets/types'
import { clearUserConversations } from '@webapp/ai/conversations/clearUserConversations'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { createOpenConversations } from '@webapp/ai/conversations/openConversations'
import { getPendingChangeSets, isChangeSetPending } from '@webapp/ai/conversations/pendingChangeSets'
import type { AssistantMessage, Conversation } from '@webapp/ai/conversations/types'
import { reconcileInProgress } from '@webapp/ai/suggestions/reconcileInProgress'
import {
  getSuggestionSettleOutcome,
  getSuggestionTurnLockName,
  holdSuggestionTurnLock,
  reportSuggestionSettle,
  withSuggestionScope,
} from '@webapp/ai/suggestions/suggestionConversation'
import { createSuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion, SuggestionKind, SuggestionRequest } from '@webapp/ai/suggestions/types'
import {
  createAssistantPanelStore,
  initialAssistantPanelState,
} from '@webapp/components/ai/Assistant/assistantPanelStore'

const NOW = new Date('2026-10-11T12:00:00.000Z')
const scope = { userUuid: 'u1', surveyId: 7 }
const SCOPE = { kind: 'missingTranslations' as const, targetKeys: ['a:labels'] }

const request = (overrides: Partial<SuggestionRequest> = {}): SuggestionRequest => ({
  requestId: 'r1',
  userUuid: 'u1',
  surveyId: 7,
  cycle: '0',
  area: 'design',
  suggestionId: 'missingTranslations:fr',
  scope: SCOPE,
  prompt: 'Translate',
  displayText: 'Translate the missing texts',
  ...overrides,
})

const newPanel = () => {
  const openConversations = createOpenConversations({ getStorage: () => null })
  const store = createAssistantPanelStore({ openConversations })
  store.setScope(scope)
  return { openConversations, store }
}

const newStore = () =>
  createSuggestionStore({
    access: { getStorage: () => null, addStorageListener: () => () => undefined },
    now: () => NOW,
  })

const changeSet = (id: string): ChangeSet => ({
  id,
  surveyId: 7,
  summary: id,
  operations: [],
  createdAt: NOW.toISOString(),
})

const answer = (status: AssistantMessage['status']): AssistantMessage => ({
  id: `a-${status}`,
  role: 'assistant',
  parts: [],
  status,
  createdAt: NOW.toISOString(),
})

const conversationWith = ({
  status = 'done',
  cards = {},
  scoped = true,
  id = 'c1',
  kind = SCOPE.kind,
}: {
  status?: AssistantMessage['status'] | null
  cards?: Record<string, ChangeSetCardState>
  scoped?: boolean
  id?: string
  kind?: SuggestionKind
}): Conversation => {
  const base = createConversation({ userUuid: 'u1', surveyId: 7, area: 'design', now: NOW, idFactory: () => id })
  const conversation: Conversation = {
    ...base,
    messages: [
      { id: 'm1', role: 'user', text: 'Translate', createdAt: NOW.toISOString() },
      ...(status ? [answer(status)] : []),
    ],
    changeSets: cards,
  }
  return scoped ? withSuggestionScope(conversation, { ...SCOPE, kind }) : conversation
}

const suggestion: AssistantSuggestion = {
  id: 'missingTranslations:fr',
  kind: 'missingTranslations',
  area: 'design',
  surveyId: 7,
  cycle: null,
  targets: [{ key: 'a:labels' }],
  createdAt: NOW.toISOString(),
  expiresAt: null,
}

const visibleCount = (store: ReturnType<typeof newStore>) =>
  store.getVisible({ userUuid: 'u1', surveyId: 7, cycle: '0', availableAreas: ['design'], enabled: true }).length

describe('Do it plumbing (214)', () => {
  test('a Do it message shows its request text (also the title); the model gets the prompt, in later turns too', () => {
    const base = createConversation({ userUuid: 'u1', surveyId: 7, area: 'design', now: NOW, idFactory: () => 'c1' })
    const state = createTurnState({
      conversation: base,
      userMessage: 'Translate the survey texts with survey_listMissingTexts',
      displayText: 'Translate the 3 missing texts into Italian.',
      onUpdate: () => undefined,
    })
    const conversation = state.get()
    expect(conversation.messages[0]).toMatchObject({
      role: 'user',
      text: 'Translate the survey texts with survey_listMissingTexts',
      displayText: 'Translate the 3 missing texts into Italian.',
    })
    // no title while the model may still name it; the request text when it didn't
    expect(conversation.title).toBe('')
    state.appendText('Proposed 1 batch. 2 remain.')
    state.finish('done')
    expect(state.get().title).toBe('Translate the 3 missing texts into Italian.')
    const history = buildHistory({ messages: state.get().messages, userMessage: 'continue', budgetChars: 10000 })
    expect(history[0]).toEqual({ role: 'user', content: 'Translate the survey texts with survey_listMissingTexts' })
    // a typed message has no display text
    const typed = createTurnState({ conversation: base, userMessage: 'Hi', onUpdate: () => undefined }).get()
    expect(typed.messages[0]).not.toHaveProperty('displayText')
  })

  test('startWithPrompt opens the area in a new conversation with the request; the previous one stays in History', () => {
    const { openConversations, store } = newPanel()
    store.setArea('design')
    store.setConversationId('old')
    store.startWithPrompt(request())
    expect(store.getState()).toMatchObject({
      open: true,
      area: 'design',
      userSelectedArea: 'design',
      conversationId: null,
      view: 'chat',
      pendingRequest: request(),
    })
    expect(openConversations.get({ ...scope, area: 'design' })).toBeNull()
  })

  test('the request is claimed once, by its id', () => {
    const { store } = newPanel()
    store.startWithPrompt(request())
    expect(store.claimPendingRequest('other')).toBeNull()
    expect(store.claimPendingRequest('r1')).toEqual(request())
    expect(store.claimPendingRequest('r1')).toBeNull()
    expect(store.getState().pendingRequest).toBeNull()
  })

  test('another user, survey or area drops the request; the same scope or area keeps it', () => {
    const { store } = newPanel()
    store.startWithPrompt(request())
    store.setScope(scope)
    store.setArea('design')
    expect(store.getState().pendingRequest).not.toBeNull()
    store.setArea('help', { byUser: true })
    expect(store.getState().pendingRequest).toBeNull()
    store.startWithPrompt(request({ requestId: 'r2' }))
    store.setScope({ userUuid: 'u1', surveyId: 8 })
    expect(store.getState().pendingRequest).toBeNull()
    store.startWithPrompt(request({ requestId: 'r3', surveyId: 8 }))
    store.reset()
    expect(store.getState()).toEqual(initialAssistantPanelState)
    expect(initialAssistantPanelState.pendingRequest).toBeNull()
  })

  test('a card is pending while neither applied nor discarded', () => {
    const cards: Record<string, ChangeSetCardState> = {
      open: { changeSet: changeSet('open') },
      applied: { changeSet: changeSet('applied'), results: [] },
      discarded: { changeSet: changeSet('discarded'), discarded: true },
    }
    expect(Object.values(cards).map(isChangeSetPending)).toEqual([true, false, false])
    expect(getPendingChangeSets(conversationWith({ cards })).map((item) => item.id)).toEqual(['open'])
  })

  test('settle outcome: wait while the answer runs or a card is pending; settled with cards, failed without', () => {
    const open = { changeSet: changeSet('x') }
    const applied = { changeSet: changeSet('x'), results: [] }
    const discarded = { changeSet: changeSet('x'), discarded: true }
    expect(getSuggestionSettleOutcome(conversationWith({ scoped: false }))).toBeNull()
    expect(getSuggestionSettleOutcome(conversationWith({ status: null }))).toBeNull()
    expect(getSuggestionSettleOutcome(conversationWith({ status: 'streaming' }))).toBeNull()
    expect(getSuggestionSettleOutcome(conversationWith({ status: 'done', cards: { x: open } }))).toBeNull()
    // an error or a Stop that left a card waits for it: failing would show the suggestion while its card can apply
    expect(getSuggestionSettleOutcome(conversationWith({ status: 'error', cards: { x: open } }))).toBeNull()
    expect(getSuggestionSettleOutcome(conversationWith({ status: 'done', cards: { x: applied } }))).toBe('settled')
    expect(getSuggestionSettleOutcome(conversationWith({ status: 'stopped', cards: { x: discarded } }))).toBe('settled')
    expect(getSuggestionSettleOutcome(conversationWith({ status: 'done' }))).toBe('failed')
    expect(getSuggestionSettleOutcome(conversationWith({ status: 'error' }))).toBe('failed')
    expect(getSuggestionSettleOutcome(conversationWith({ status: 'streaming' }), { running: false })).toBe('failed')
    // the explanation kinds have no card: a completed answer settles them, a failed or stopped one does not
    for (const kind of ['validationErrors', 'dataImported'] as const) {
      expect(getSuggestionSettleOutcome(conversationWith({ status: 'done', kind }))).toBe('settled')
      expect(getSuggestionSettleOutcome(conversationWith({ status: 'error', kind }))).toBe('failed')
      expect(getSuggestionSettleOutcome(conversationWith({ status: 'stopped', kind }))).toBe('failed')
    }
  })

  test('the settle report moves the in-progress targets: failed shows the card again, settled dismisses it', () => {
    const store = newStore()
    store.add({ userUuid: 'u1', suggestion })
    store.startProgress({ userUuid: 'u1', surveyId: 7, id: suggestion.id, conversationId: 'c1' })
    expect(visibleCount(store)).toBe(0)
    expect(reportSuggestionSettle({ conversation: conversationWith({ status: 'error' }), store })).toBe('failed')
    expect(visibleCount(store)).toBe(1)
    store.startProgress({ userUuid: 'u1', surveyId: 7, id: suggestion.id, conversationId: 'c2' })
    const cards = { x: { changeSet: changeSet('x'), results: [] } }
    expect(reportSuggestionSettle({ conversation: conversationWith({ id: 'c2', cards }), store })).toBe('settled')
    expect(store.getInProgressConversationIds('u1')).toEqual([])
    expect(visibleCount(store)).toBe(0)
  })

  test('reconcile at mount: a missing or unreadable conversation fails, a leftover streaming answer counts as stopped', async () => {
    const store = newStore()
    const ids = ['missing', 'unreadable', 'leftover', 'pendingCard']
    for (const id of ids) {
      store.add({ userUuid: 'u1', suggestion: { ...suggestion, id: `missingTranslations:${id}` } })
      store.startProgress({ userUuid: 'u1', surveyId: 7, id: `missingTranslations:${id}`, conversationId: id })
    }
    const stored: Record<string, Conversation> = {
      leftover: conversationWith({ id: 'leftover', status: 'streaming' }),
      pendingCard: conversationWith({ id: 'pendingCard', cards: { x: { changeSet: changeSet('x') } } }),
    }
    const load = async (id: string) => {
      if (id === 'unreadable') throw new Error('IndexedDB error')
      return stored[id] ?? null
    }
    await reconcileInProgress({ store, userUuid: 'u1', load })
    expect(store.getInProgressConversationIds('u1')).toEqual(['pendingCard'])
    expect(visibleCount(store)).toBe(3)
  })

  test('reconcile at mount leaves alone a conversation whose turn lock is held by another tab', async () => {
    const store = newStore()
    for (const id of ['running', 'gone']) {
      store.add({ userUuid: 'u1', suggestion: { ...suggestion, id: `missingTranslations:${id}` } })
      store.startProgress({ userUuid: 'u1', surveyId: 7, id: `missingTranslations:${id}`, conversationId: id })
    }
    await reconcileInProgress({
      store,
      userUuid: 'u1',
      load: async () => null,
      getHeldLockNames: async () => [getSuggestionTurnLockName('running'), 'other'],
    })
    expect(store.getInProgressConversationIds('u1')).toEqual(['running'])
  })

  test('the turn lock is requested by conversation and released when the turn ends, even by error', async () => {
    const requested: string[] = []
    let release: Promise<unknown> | null = null
    const locks = {
      request: ((name: string, callback: () => Promise<unknown>) => {
        requested.push(name)
        release = callback()
        return release
      }) as unknown as LockManager['request'],
    }
    let fail: (error: Error) => void = () => undefined
    const done = new Promise<void>((_resolve, reject) => {
      fail = reject
    })
    done.catch(() => undefined)
    holdSuggestionTurnLock({ conversationId: 'c1', done, locks })
    expect(requested).toEqual([getSuggestionTurnLockName('c1')])
    let released = false
    release!.then(() => {
      released = true
    })
    await Promise.resolve()
    expect(released).toBe(false)
    fail(new Error('turn failed'))
    await release
    expect(released).toBe(true)
    // no API: nothing happens
    holdSuggestionTurnLock({ conversationId: 'c1', done, locks: null })
  })

  test('Clear conversations clears the suggestions of the user too', async () => {
    const calls: string[] = []
    await clearUserConversations({
      conversationStore: { clearUser: async (userUuid) => void calls.push(`conversations:${userUuid}`) },
      openConversations: { clear: (userUuid) => calls.push(`open:${userUuid}`) },
      suggestions: { clearUser: (userUuid) => calls.push(`suggestions:${userUuid}`) },
      userUuid: 'u1',
    })
    expect(calls).toEqual(['open:u1', 'suggestions:u1', 'conversations:u1'])
  })
})
