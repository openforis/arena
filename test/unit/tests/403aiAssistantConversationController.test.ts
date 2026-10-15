import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { createOpenConversations } from '@webapp/ai/conversations/openConversations'
import type { ConversationStore } from '@webapp/ai/conversations/conversationStore'
import type { AssistantMessage, Conversation } from '@webapp/ai/conversations/types'
import type { RunAssistantTurnParams } from '@webapp/ai/agent/runAssistantTurn'
import type { ChangeSet } from '@webapp/ai/changeSets/types'
import type { AiToolContext } from '@webapp/ai/tools/types'
import {
  createAssistantConversationController,
  type AssistantConversationDeps,
  type AssistantConversationEnv,
  type AssistantConversationScope,
} from '@webapp/components/ai/Assistant/assistantConversationController'
import { withStreamingFailed } from '@webapp/components/ai/Assistant/assistantPanelModel'
import { createAssistantPanelStore } from '@webapp/components/ai/Assistant/assistantPanelStore'
import { createAssistantTurnRegistry } from '@webapp/components/ai/Assistant/assistantTurnRegistry'

const createdAt = '2026-10-15T10:00:00.000Z'
const scope: AssistantConversationScope = { userUuid: 'user-403', surveyId: 1, area: 'design' }
const env: AssistantConversationEnv = {
  ...scope,
  cycle: '2020',
  lang: 'en',
  buildToolContext: () => ({}) as AiToolContext,
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve))

const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const answer = (status: AssistantMessage['status']): AssistantMessage => ({
  id: `a-${status}`,
  role: 'assistant',
  parts: [{ type: 'text', text: 'answer' }],
  status,
  createdAt,
})

const withTurn = (conversation: Conversation, text: string, status: AssistantMessage['status']): Conversation => ({
  ...conversation,
  messages: [
    ...conversation.messages,
    { id: `u-${conversation.messages.length}`, role: 'user', text, createdAt },
    answer(status),
  ],
})

const storedConversation = (id: string, overrides: Partial<Conversation> = {}): Conversation => ({
  ...createConversation({ userUuid: scope.userUuid, surveyId: scope.surveyId, area: scope.area, idFactory: () => id }),
  title: `title ${id}`,
  ...overrides,
})

const createFakeStore = (initial: Conversation[]) => {
  const data = new Map(initial.map((conversation) => [conversation.id, conversation]))
  const store = {
    persistent: true,
    list: jest.fn(async () => [...data.values()]),
    get: jest.fn(async (id: string) => data.get(id) ?? null),
    save: jest.fn(async (conversation: Conversation) => {
      data.set(conversation.id, conversation)
    }),
    remove: jest.fn(async (id: string) => {
      data.delete(id)
    }),
    clearUser: jest.fn(async () => data.clear()),
  }
  return store satisfies ConversationStore
}

type TurnControl = {
  run: jest.Mock<Promise<Conversation>, [RunAssistantTurnParams]>
  params: RunAssistantTurnParams[]
  release: (index?: number, status?: AssistantMessage['status']) => void
}

// a turn that ends when released (and, like the real one, when aborted unless told otherwise)
const createTurnControl = ({ endOnAbort = true }: { endOnAbort?: boolean } = {}): TurnControl => {
  const params: RunAssistantTurnParams[] = []
  const releases: ((status: AssistantMessage['status']) => void)[] = []
  const run = jest.fn(
    (turnParams: RunAssistantTurnParams) =>
      new Promise<Conversation>((resolve) => {
        params.push(turnParams)
        const end = (status: AssistantMessage['status']) =>
          resolve(withTurn(turnParams.conversation, turnParams.userMessage, status))
        releases.push(end)
        if (endOnAbort) turnParams.signal.addEventListener('abort', () => end('stopped'))
      })
  )
  return { run, params, release: (index = 0, status = 'done') => releases[index]?.(status) }
}

const instantTurn = jest.fn(async (params: RunAssistantTurnParams) => {
  const final = withTurn(params.conversation, params.userMessage, 'done')
  params.onUpdate(final)
  return final
})

const setup = async ({
  conversations = [] as Conversation[],
  runTurn = instantTurn as AssistantConversationDeps['runTurn'],
} = {}) => {
  instantTurn.mockClear()
  const openConversations = createOpenConversations({ getStorage: () => null })
  const panel = createAssistantPanelStore({ openConversations })
  const registry = createAssistantTurnRegistry()
  const store = createFakeStore(conversations)
  const suggestions = {
    withScope: jest.fn((conversation: Conversation, suggestionScope: any) => ({
      ...conversation,
      suggestionScope,
    })),
    reportSettle: jest.fn(),
    holdTurnLock: jest.fn(),
    onConversationSettled: jest.fn(),
  }
  const cards = { applyOperations: jest.fn(), applyRecordEdits: jest.fn() }
  const clearUserData = jest.fn(async () => undefined)
  const loadAccess = jest.fn(async () => ({ effective: null }))
  const controller = createAssistantConversationController({
    getStore: async () => store,
    panel,
    registry,
    runTurn,
    loadAccess,
    clearUserData,
    suggestions,
    cards,
  })
  panel.setScope({ userUuid: scope.userUuid, surveyId: scope.surveyId })
  panel.setArea('design')
  await controller.init()
  return { controller, panel, registry, store, suggestions, cards, clearUserData, runTurn }
}

const lastSaved = (store: ReturnType<typeof createFakeStore>, id: string): Conversation | undefined =>
  store.save.mock.calls
    .map(([saved]) => saved)
    .filter((saved) => saved.id === id)
    .at(-1)

describe('assistant conversation controller (403)', () => {
  describe('store and loading', () => {
    test('it is ready once the store is open, and reports a memory store as not persistent', async () => {
      const store = { ...createFakeStore([]), persistent: false }
      const controller = createAssistantConversationController({
        getStore: async () => store,
        panel: createAssistantPanelStore({ openConversations: createOpenConversations({ getStorage: () => null }) }),
        registry: createAssistantTurnRegistry(),
        runTurn: instantTurn,
        loadAccess: async () => ({ effective: null }),
        clearUserData: async () => undefined,
        suggestions: {
          withScope: (c) => c,
          reportSettle: jest.fn(),
          holdTurnLock: jest.fn(),
          onConversationSettled: jest.fn(),
        },
        cards: { applyOperations: jest.fn(), applyRecordEdits: jest.fn() },
      })
      expect(controller.getState().ready).toBe(false)
      await expect(controller.send(env, 'too early')).resolves.toBeNull()
      await controller.init()
      expect(controller.getState()).toMatchObject({ ready: true, persistent: false })
    })

    test('the selected conversation is loaded and shown', async () => {
      const { controller, panel } = await setup({ conversations: [storedConversation('c1')] })
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      await flush()
      expect(controller.getState().conversation?.id).toBe('c1')
    })

    test('a selection made before the store opened is loaded when it opens', async () => {
      const store = createFakeStore([storedConversation('c1')])
      const gate = deferred<ConversationStore>()
      const panel = createAssistantPanelStore({
        openConversations: createOpenConversations({ getStorage: () => null }),
      })
      panel.setScope({ userUuid: scope.userUuid, surveyId: scope.surveyId })
      panel.setArea('design')
      panel.setConversationId('c1')
      const controller = createAssistantConversationController({
        getStore: () => gate.promise,
        panel,
        registry: createAssistantTurnRegistry(),
        runTurn: instantTurn,
        loadAccess: async () => ({ effective: null }),
        clearUserData: async () => undefined,
        suggestions: {
          withScope: (c) => c,
          reportSettle: jest.fn(),
          holdTurnLock: jest.fn(),
          onConversationSettled: jest.fn(),
        },
        cards: { applyOperations: jest.fn(), applyRecordEdits: jest.fn() },
      })
      const opened = controller.init()
      controller.select(scope, 'c1')
      expect(controller.getState().conversation).toBeNull()
      gate.resolve(store)
      await opened
      await flush()
      expect(controller.getState().conversation?.id).toBe('c1')
    })

    test('a stored conversation of another survey is forgotten as the open one', async () => {
      const foreign = storedConversation('c9', { surveyId: 9, surveyKey: 9 })
      const { controller, panel } = await setup({ conversations: [foreign] })
      panel.setConversationId('c9')
      controller.select(scope, 'c9')
      await flush()
      expect(panel.getState().conversationId).toBeNull()
      expect(controller.getState().conversation).toBeNull()
    })

    test('a conversation that cannot be read is forgotten, the chat starts blank', async () => {
      const { controller, panel, store } = await setup()
      store.get.mockRejectedValueOnce(new Error('idb'))
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      await flush()
      expect(panel.getState().conversationId).toBeNull()
    })

    test('leaving the conversation drops the copy in memory, so it is read again when reopened', async () => {
      const { controller, panel, store } = await setup({ conversations: [storedConversation('c1')] })
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      await flush()
      panel.setConversationId(null)
      controller.select(scope, null)
      expect(controller.getState().conversation).toBeNull()
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      await flush()
      expect(store.get).toHaveBeenCalledTimes(2)
    })
  })

  describe('send while the remembered conversation loads', () => {
    test('the message goes into that conversation, not into a new one', async () => {
      const remembered = withTurn(storedConversation('c1'), 'first', 'done')
      const { controller, panel, store, runTurn, registry } = await setup({ conversations: [remembered] })
      const read = deferred<Conversation | null>()
      store.get.mockImplementationOnce(() => read.promise)
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      const sent = controller.send(env, 'second')
      await flush()
      expect(runTurn).not.toHaveBeenCalled()
      read.resolve(remembered)
      await expect(sent).resolves.toBe('c1')
      await registry.settle()
      expect(runTurn).toHaveBeenCalledTimes(1)
      const { conversation } = (runTurn as jest.Mock).mock.calls[0][0]
      expect(conversation.id).toBe('c1')
      expect(conversation.messages).toHaveLength(remembered.messages.length)
      expect(panel.getState().conversationId).toBe('c1')
    })

    test('when the remembered conversation is not usable, the message starts a new one', async () => {
      const foreign = storedConversation('c9', { surveyId: 9, surveyKey: 9 })
      const { controller, panel, registry } = await setup({ conversations: [foreign] })
      panel.setConversationId('c9')
      controller.select(scope, 'c9')
      const id = await controller.send(env, 'hello')
      await registry.settle()
      expect(id).not.toBeNull()
      expect(id).not.toBe('c9')
      expect(panel.getState().conversationId).toBe(id)
    })

    test('an id that is selected but not loaded never gets a new conversation in its place', async () => {
      const { controller, panel, runTurn } = await setup()
      panel.setConversationId('c1')
      await expect(controller.send(env, 'hello')).resolves.toBeNull()
      expect(runTurn).not.toHaveBeenCalled()
    })

    test('a blank chat creates a conversation for the first message and selects it', async () => {
      const { controller, panel, registry, store } = await setup()
      const id = await controller.send(env, 'hello')
      await registry.settle()
      expect(panel.getState().conversationId).toBe(id)
      expect(lastSaved(store, id as string)?.messages).toHaveLength(2)
      expect(controller.getState()).toMatchObject({ busy: false })
      expect(controller.getState().conversation?.id).toBe(id)
    })

    test('nothing is sent while a turn runs or a card is applied', async () => {
      const turn = createTurnControl()
      const { controller, runTurn } = await setup({ runTurn: turn.run })
      const first = await controller.send(env, 'one')
      expect(first).not.toBeNull()
      await expect(controller.send(env, 'two')).resolves.toBeNull()
      await flush()
      expect(runTurn).toHaveBeenCalledTimes(1)
    })
  })

  describe('another survey or user', () => {
    test('switching survey stops the running turn and frees busy at once', async () => {
      const turn = createTurnControl({ endOnAbort: false })
      const { controller } = await setup({ runTurn: turn.run })
      await controller.send(env, 'hello')
      await flush()
      expect(controller.getState().busy).toBe(true)
      controller.setScope({ ...scope, surveyId: 2 })
      expect(turn.params[0].signal.aborted).toBe(true)
      expect(controller.getState().busy).toBe(false)
    })

    test('the late end of the stopped turn leaves the next survey turn busy, and its answer is saved but not shown', async () => {
      const turn = createTurnControl({ endOnAbort: false })
      const { controller, panel, registry, store } = await setup({ runTurn: turn.run })
      const oldId = (await controller.send(env, 'hello')) as string
      await flush()
      controller.setScope({ ...scope, surveyId: 2 })
      panel.setScope({ userUuid: scope.userUuid, surveyId: 2 })
      const env2 = { ...env, surveyId: 2 }
      const newId = (await controller.send(env2, 'again')) as string
      await flush()
      expect(controller.getState().busy).toBe(true)
      const late = withTurn(turn.params[0].conversation, 'hello', 'stopped')
      turn.params[0].onUpdate(late)
      turn.release(0, 'stopped')
      await flush()
      expect(controller.getState().busy).toBe(true)
      expect(controller.getState().conversation?.id).toBe(newId)
      expect(lastSaved(store, oldId)?.messages.at(-1)).toMatchObject({ status: 'stopped' })
      turn.release(1)
      await registry.settle()
      expect(controller.getState().busy).toBe(false)
    })

    test('another user stops the turn too, another area does not', async () => {
      const turn = createTurnControl({ endOnAbort: false })
      const { controller } = await setup({ runTurn: turn.run })
      await controller.send(env, 'hello')
      await flush()
      controller.setScope({ ...scope, area: 'analysis' })
      expect(turn.params[0].signal.aborted).toBe(false)
      expect(controller.getState().busy).toBe(true)
      controller.setScope({ ...scope, userUuid: 'someone-else' })
      expect(turn.params[0].signal.aborted).toBe(true)
      expect(controller.getState().busy).toBe(false)
    })

    test('a reset (logout) stops the turn for the UI but its last state is still saved', async () => {
      const turn = createTurnControl()
      const { controller, registry, store } = await setup({ runTurn: turn.run })
      const id = (await controller.send(env, 'hello')) as string
      await flush()
      registry.abortAll()
      turn.params[0].onUpdate(withTurn(turn.params[0].conversation, 'hello', 'streaming'))
      await registry.settle()
      expect(controller.getState().conversation?.messages ?? []).toHaveLength(0)
      expect(lastSaved(store, id)?.messages.at(-1)).toMatchObject({ status: 'stopped' })
    })
  })

  describe('turns', () => {
    test('Stop aborts the running turn and busy ends with it', async () => {
      const turn = createTurnControl()
      const { controller, registry } = await setup({ runTurn: turn.run })
      await controller.send(env, 'hello')
      await flush()
      controller.stop()
      await registry.settle()
      expect(turn.params[0].signal.aborted).toBe(true)
      expect(controller.getState().busy).toBe(false)
      expect(controller.getState().conversation?.messages.at(-1)).toMatchObject({ status: 'stopped' })
    })

    test('Retry sends the user message of the failed answer again, without the failed pair', async () => {
      const failed = withTurn(storedConversation('c1'), 'the question', 'error')
      const { controller, panel, runTurn, registry } = await setup({ conversations: [failed] })
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      await flush()
      controller.retry(env)
      await registry.settle()
      const params = (runTurn as jest.Mock).mock.calls[0][0]
      expect(params.userMessage).toBe('the question')
      expect(params.conversation.messages).toHaveLength(0)
    })

    test('Retry does nothing when the last answer did not fail', async () => {
      const done = withTurn(storedConversation('c1'), 'the question', 'done')
      const { controller, panel, runTurn } = await setup({ conversations: [done] })
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      await flush()
      controller.retry(env)
      await flush()
      expect(runTurn).not.toHaveBeenCalled()
    })

    test('an unexpected failure of the turn is caught: no spinner, no rejection, the conversation is still tracked', async () => {
      const run = jest.fn(async (params: RunAssistantTurnParams) => {
        params.onUpdate(withTurn(params.conversation, params.userMessage, 'streaming'))
        throw new Error('boom')
      })
      const { controller, registry } = await setup({ runTurn: run })
      const id = await controller.send(env, 'hello')
      await expect(registry.settle()).resolves.toBeUndefined()
      expect(id).not.toBeNull()
      expect(controller.getState().busy).toBe(false)
      expect(controller.getState().conversation?.messages.at(-1)).toMatchObject({ status: 'error' })
    })

    test('a Do it request starts a new conversation with the suggestion scope and holds the turn lock', async () => {
      const remembered = storedConversation('c1')
      const { controller, panel, registry, suggestions } = await setup({ conversations: [remembered] })
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      await flush()
      const suggestionScope = { kind: 'labels', targets: [] }
      const id = (await controller.send(env, 'do it', {
        suggestion: { id: 's1', scope: suggestionScope as any },
      })) as string
      await registry.settle()
      expect(id).not.toBe('c1')
      expect(suggestions.holdTurnLock).toHaveBeenCalledWith(expect.objectContaining({ conversationId: id }))
      expect(suggestions.reportSettle).toHaveBeenCalledWith(expect.objectContaining({ running: false }))
    })
  })

  describe('provider pick', () => {
    test('a pick in a blank chat is used by the conversation its first message creates, then forgotten', async () => {
      const { controller, registry, runTurn } = await setup()
      controller.chooseProvider('provider-1')
      expect(controller.getState().pendingProviderId).toBe('provider-1')
      await controller.send(env, 'hello')
      await registry.settle()
      expect((runTurn as jest.Mock).mock.calls[0][0].conversation.providerId).toBe('provider-1')
      expect(controller.getState().pendingProviderId).toBeUndefined()
    })

    test('no provider is picked while a turn runs', async () => {
      const turn = createTurnControl()
      const { controller, store } = await setup({ runTurn: turn.run })
      await controller.send(env, 'hello')
      await flush()
      controller.chooseProvider('provider-1')
      expect(controller.getState().pendingProviderId).toBeUndefined()
      expect(store.save.mock.calls.every(([saved]) => saved.providerId === undefined)).toBe(true)
    })

    test('the pending pick does not carry over to another area, survey or user', async () => {
      const { controller } = await setup()
      controller.setScope(scope)
      controller.chooseProvider('provider-1')
      controller.setScope(scope)
      expect(controller.getState().pendingProviderId).toBe('provider-1')
      controller.setScope({ ...scope, area: 'analysis' })
      expect(controller.getState().pendingProviderId).toBeUndefined()
    })

    test('a pick on the shown conversation is saved with it', async () => {
      const { controller, panel, store } = await setup({ conversations: [storedConversation('c1')] })
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      await flush()
      controller.chooseProvider('provider-2')
      expect(controller.getState().conversation?.providerId).toBe('provider-2')
      expect(lastSaved(store, 'c1')?.providerId).toBe('provider-2')
    })

    test('a pick while the conversation is still loading is ignored', async () => {
      const { controller, panel, store } = await setup({ conversations: [storedConversation('c1')] })
      store.get.mockImplementationOnce(() => new Promise(() => undefined))
      panel.setConversationId('c1')
      controller.select(scope, 'c1')
      controller.chooseProvider('provider-2')
      expect(controller.getState().pendingProviderId).toBeUndefined()
    })

    test('New conversation and opening one clear the pick and close the chooser', async () => {
      const { controller } = await setup()
      controller.chooseProvider('provider-1')
      controller.setProviderChooserOpen(true)
      controller.newConversation()
      expect(controller.getState()).toMatchObject({ pendingProviderId: undefined, providerChooserOpen: false })
      controller.chooseProvider('provider-1')
      controller.setProviderChooserOpen(true)
      controller.openConversation('c1')
      expect(controller.getState()).toMatchObject({ pendingProviderId: undefined, providerChooserOpen: false })
    })
  })

  describe('history and conversations list', () => {
    test('the list shows the conversations of the area only', async () => {
      const { controller } = await setup({
        conversations: [storedConversation('d1'), storedConversation('h1', { area: 'help' })],
      })
      await controller.loadHistory(scope)
      expect(controller.getState().history.map(({ id }) => id)).toEqual(['d1'])
    })

    test('an older, slower request does not overwrite a newer list', async () => {
      const { controller, store } = await setup()
      const slow = deferred<Conversation[]>()
      store.list.mockImplementationOnce(() => slow.promise)
      const first = controller.loadHistory(scope)
      store.list.mockImplementationOnce(async () => [storedConversation('new')])
      await controller.loadHistory(scope)
      slow.resolve([storedConversation('old')])
      await first
      expect(controller.getState().history.map(({ id }) => id)).toEqual(['new'])
    })

    test('a list that arrives after the scope changed is dropped, and the previous list is not shown meanwhile', async () => {
      const { controller, store } = await setup()
      await controller.loadHistory(scope)
      store.list.mockImplementationOnce(async () => [storedConversation('d1')])
      await controller.loadHistory(scope)
      expect(controller.getState().history).toHaveLength(1)
      const slow = deferred<Conversation[]>()
      store.list.mockImplementationOnce(() => slow.promise)
      const pending = controller.loadHistory(scope)
      controller.setScope({ ...scope, area: 'analysis' })
      expect(controller.getState().history).toEqual([])
      slow.resolve([storedConversation('late')])
      await pending
      expect(controller.getState().history).toEqual([])
    })

    test('a list that cannot be read leaves the previous one', async () => {
      const { controller, store } = await setup({ conversations: [storedConversation('d1')] })
      await controller.loadHistory(scope)
      store.list.mockRejectedValueOnce(new Error('idb'))
      await expect(controller.loadHistory(scope)).resolves.toBeUndefined()
      expect(controller.getState().history).toHaveLength(1)
    })

    test('Delete removes the conversation, and the open one goes back to the list', async () => {
      const { controller, panel, store, suggestions } = await setup({
        conversations: [storedConversation('c1'), storedConversation('c2')],
      })
      await controller.loadHistory(scope)
      panel.setConversationId('c1')
      await controller.deleteConversation(scope, 'c1')
      expect(store.remove).toHaveBeenCalledWith('c1')
      expect(controller.getState().history.map(({ id }) => id)).toEqual(['c2'])
      expect(suggestions.onConversationSettled).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'c1', outcome: 'failed' })
      )
      expect(panel.getState()).toMatchObject({ conversationId: null, view: 'history' })
    })

    test('a failed delete is caught and the list stays', async () => {
      const { controller, store } = await setup({ conversations: [storedConversation('c1')] })
      await controller.loadHistory(scope)
      store.remove.mockRejectedValueOnce(new Error('idb'))
      await expect(controller.deleteConversation(scope, 'c1')).resolves.toBeUndefined()
      expect(controller.getState().history).toHaveLength(1)
    })

    test('Delete every conversation clears the list and the chat', async () => {
      const { controller, panel, clearUserData } = await setup({ conversations: [storedConversation('c1')] })
      await controller.loadHistory(scope)
      panel.setConversationId('c1')
      await controller.clearConversations(scope)
      expect(clearUserData).toHaveBeenCalledWith(expect.objectContaining({ userUuid: scope.userUuid }))
      expect(controller.getState().history).toEqual([])
      expect(panel.getState().conversationId).toBeNull()
    })

    test('a failed clear is caught and nothing changes', async () => {
      const { controller, panel, clearUserData } = await setup({ conversations: [storedConversation('c1')] })
      await controller.loadHistory(scope)
      panel.setConversationId('c1')
      clearUserData.mockRejectedValueOnce(new Error('idb'))
      await expect(controller.clearConversations(scope)).resolves.toBeUndefined()
      expect(controller.getState().history).toHaveLength(1)
      expect(panel.getState().conversationId).toBe('c1')
    })
  })

  describe('card actions', () => {
    const changeSet: ChangeSet = { id: 'cs1', surveyId: 1, summary: 'summary', operations: [], createdAt }
    const withCard = (): Conversation => ({
      ...storedConversation('c1'),
      changeSets: { cs1: { changeSet } },
    })

    const openCard = async (options: Parameters<typeof setup>[0] = {}) => {
      const context = await setup({ conversations: [withCard()], ...options })
      context.panel.setConversationId('c1')
      context.controller.select(scope, 'c1')
      await flush()
      return context
    }

    test('Apply saves the results with the note for the model, and blocks other actions meanwhile', async () => {
      const { controller, cards, store, suggestions } = await openCard()
      const finish = deferred<{ results: any[]; note: string }>()
      cards.applyOperations.mockImplementationOnce(() => finish.promise)
      const applying = controller.apply('cs1', ['op1'])
      await flush()
      expect(controller.getState().applying).toBe(true)
      await expect(controller.send(env, 'hello')).resolves.toBeNull()
      finish.resolve({ results: [{ id: 'op1', status: 'applied' }], note: 'Applied 1 change.' })
      await applying
      expect(controller.getState().applying).toBe(false)
      expect(cards.applyOperations).toHaveBeenCalledWith({ changeSet, operationIds: ['op1'] })
      const saved = lastSaved(store, 'c1')
      expect(saved?.changeSets.cs1.results).toEqual([{ id: 'op1', status: 'applied' }])
      expect(saved?.messages.at(-1)).toMatchObject({ role: 'applyNote', text: 'Applied 1 change.' })
      expect(controller.getState().conversation).toEqual(saved)
      expect(suggestions.reportSettle).toHaveBeenCalled()
    })

    test('Apply does nothing when the designer is not ready', async () => {
      const { controller, cards, store } = await openCard()
      cards.applyOperations.mockResolvedValueOnce(null)
      await controller.apply('cs1', ['op1'])
      expect(store.save).not.toHaveBeenCalled()
    })

    test('no card action while a turn runs', async () => {
      const turn = createTurnControl()
      const { controller, cards } = await openCard({ runTurn: turn.run })
      await controller.send(env, 'hello')
      await controller.apply('cs1', ['op1'])
      await controller.discard('cs1')
      expect(cards.applyOperations).not.toHaveBeenCalled()
    })

    test('Discard marks the card and tells the model', async () => {
      const { controller, store } = await openCard()
      await controller.discard('cs1')
      const saved = lastSaved(store, 'c1')
      expect(saved?.changeSets.cs1.discarded).toBe(true)
      expect(saved?.messages.at(-1)).toMatchObject({ role: 'applyNote' })
    })

    test('record edits get the cycle, the language and the progress callback, and their results are saved', async () => {
      const { controller, cards, store } = await openCard()
      const onProgress = jest.fn()
      cards.applyRecordEdits.mockResolvedValueOnce({ results: [{ id: 'e1', status: 'applied' }], note: 'Edited.' })
      await controller.applyRecordEdits(env, 'cs1', ['e1'], onProgress)
      expect(cards.applyRecordEdits).toHaveBeenCalledWith({
        changeSet,
        operationIds: ['e1'],
        cycle: '2020',
        lang: 'en',
        onProgress,
      })
      expect(lastSaved(store, 'c1')?.changeSets.cs1.results).toEqual([{ id: 'e1', status: 'applied' }])
    })

    test('a store error while saving record edit results is caught', async () => {
      const { controller, cards, store } = await openCard()
      cards.applyRecordEdits.mockResolvedValueOnce({ results: [], note: 'Edited.' })
      store.save.mockRejectedValueOnce(new Error('idb'))
      await expect(controller.applyRecordEdits(env, 'cs1', ['e1'])).resolves.toBeUndefined()
      expect(controller.getState().applying).toBe(false)
    })

    test('the results go into the applied conversation even when the user opened another meanwhile', async () => {
      const { controller, panel, cards, store } = await openCard()
      const finish = deferred<{ results: any[]; note: string }>()
      cards.applyOperations.mockImplementationOnce(() => finish.promise)
      const applying = controller.apply('cs1', ['op1'])
      await flush()
      panel.setConversationId(null)
      controller.select(scope, null)
      finish.resolve({ results: [{ id: 'op1', status: 'applied' }], note: 'Done.' })
      await applying
      expect(lastSaved(store, 'c1')?.changeSets.cs1.results).toHaveLength(1)
      expect(controller.getState().conversation).toBeNull()
    })
  })

  describe('withStreamingFailed', () => {
    test('marks the streaming answers failed and keeps the rest', () => {
      const conversation = withTurn(storedConversation('c1'), 'q', 'streaming')
      const failed = withStreamingFailed(conversation)
      expect(failed.messages.at(-1)).toMatchObject({ status: 'error' })
      expect(failed.messages[0]).toBe(conversation.messages[0])
    })

    test('returns the same conversation when nothing was streaming', () => {
      const conversation = withTurn(storedConversation('c1'), 'q', 'done')
      expect(withStreamingFailed(conversation)).toBe(conversation)
    })
  })
})
