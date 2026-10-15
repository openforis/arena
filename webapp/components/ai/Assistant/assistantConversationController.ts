/**
 * The conversation of the assistant panel without React: loading the remembered one, turns, Stop / Retry, provider
 * pick, history and Apply / Discard of the cards, all saved in the conversation store. The hook only subscribes to its
 * state and passes the scope (user, survey, area) of each render to the actions, so nothing is mirrored in refs.
 */
import { createConversation, withConversationProvider } from '@webapp/ai/conversations/conversationModel'
import type { ConversationStore } from '@webapp/ai/conversations/conversationStore'
import { escalateConversationDataClass } from '@webapp/ai/conversations/dataClass'
import type { Conversation } from '@webapp/ai/conversations/types'
import type { RunAssistantTurnParams } from '@webapp/ai/agent/runAssistantTurn'
import type { ChangeSet, OperationResult } from '@webapp/ai/changeSets/types'
import type { SuggestionScope, SettleOutcome } from '@webapp/ai/suggestions/types'
import type { AiToolContext } from '@webapp/ai/tools/types'
import { logAiWarning } from '@webapp/ai/log/aiLog'

import type { AssistantArea } from './assistantAreas'
import {
  canShowAfterSave,
  decideLoadedConversation,
  getRetryBase,
  normalizeLoadedConversation,
  withApplyResults,
  withDiscarded,
  withStreamingFailed,
  type LoadedConversationDecision,
} from './assistantPanelModel'
import type { AssistantPanelStore } from './assistantPanelStore'
import type { AssistantTurnRegistry } from './assistantTurnRegistry'
import { startsAsDataConversation } from './cleaning/cleaningArea'

// Do it: a new conversation that keeps the suggestion's scope for its tools; displayText: what the chat shows instead
// of the text (the model still gets the text)
export type AssistantSendOptions = { suggestion?: { id: string; scope: SuggestionScope }; displayText?: string }

export type AssistantConversationState = {
  // the conversation store is open (a suggestion request waits for it)
  ready: boolean
  // false when the browser can't store conversations (memory store)
  persistent: boolean
  // the last conversation shown: use selectShownConversation to know whether it is the selected one
  conversation: Conversation | null
  // a turn is running
  busy: boolean
  // a change set card is being applied or discarded
  applying: boolean
  // a provider picked in a blank chat, for the conversation its first message creates
  pendingProviderId: string | undefined
  // the "Answer with" popover of the composer is open
  providerChooserOpen: boolean
  history: Conversation[]
}

// what the actions need to know about the panel: the conversations belong to a user, a survey and an area
export type AssistantConversationScope = { userUuid: string; surveyId: number | null; area: AssistantArea }

// the scope plus what a turn and a record edit read from the app when they start
export type AssistantConversationEnv = AssistantConversationScope & {
  cycle: string
  lang: string
  buildToolContext: (area: AssistantArea) => AiToolContext
}

export type CardApplyOutcome = { results: OperationResult[]; note: string }

// what the controller asks the app to do for a card (the hook binds them to the redux store)
export type AssistantCardAppliers = {
  // null: the designer is not ready (an unsaved edit), nothing was applied
  applyOperations: (params: { changeSet: ChangeSet; operationIds: string[] }) => Promise<CardApplyOutcome | null>
  // failures of the batch request come back as failed results
  applyRecordEdits: (params: {
    changeSet: ChangeSet
    operationIds: string[]
    cycle: string
    lang: string
    onProgress?: (done: number, total: number) => void
  }) => Promise<CardApplyOutcome>
}

export type AssistantSuggestionHooks = {
  withScope: (conversation: Conversation, scope: SuggestionScope) => Conversation
  // a Do it conversation: its targets settle once no card is pending, or show again when it made no card
  reportSettle: (params: { conversation: Conversation; running?: boolean }) => void
  // other tabs see the turn of a Do it conversation as running while the lock is held
  holdTurnLock: (params: { conversationId: string; done: Promise<unknown> }) => void
  onConversationSettled: (params: { userUuid: string; conversationId: string; outcome: SettleOutcome }) => void
}

export type AssistantConversationDeps = {
  getStore: () => Promise<ConversationStore>
  panel: Pick<AssistantPanelStore, 'getState' | 'setConversationId' | 'startNewConversation' | 'showHistory'>
  registry: AssistantTurnRegistry
  runTurn: (params: RunAssistantTurnParams) => Promise<Conversation>
  loadAccess: (params: { surveyId: number | null }) => Promise<RunAssistantTurnParams['access']>
  // deletes every conversation of the user and what points to them
  clearUserData: (params: { conversationStore: ConversationStore; userUuid: string }) => Promise<void>
  suggestions: AssistantSuggestionHooks
  cards: AssistantCardAppliers
}

export type AssistantConversationController = {
  subscribe: (listener: () => void) => () => void
  getState: () => AssistantConversationState
  // opens the conversation store (once)
  init: () => Promise<void>
  // the panel unmounts (logout): stops the running answer
  abortRunning: () => void
  // the scope of a render: another user or survey stops a turn that is no longer shown, another area drops the pick
  setScope: (scope: AssistantConversationScope) => void
  // the panel shows this conversation id (null: none): loads it when it is not the one in memory
  select: (scope: AssistantConversationScope, conversationId: string | null) => void
  // resolves with the conversation id once the turn was created; null when nothing was sent
  send: (env: AssistantConversationEnv, text: string, options?: AssistantSendOptions) => Promise<string | null>
  stop: () => void
  retry: (env: AssistantConversationEnv) => void
  chooseProvider: (providerId: string) => void
  setProviderChooserOpen: (open: boolean) => void
  newConversation: () => void
  openConversation: (id: string) => void
  loadHistory: (scope: AssistantConversationScope) => Promise<void>
  clearConversations: (scope: AssistantConversationScope) => Promise<void>
  deleteConversation: (scope: AssistantConversationScope, id: string) => Promise<void>
  apply: (changeSetId: string, operationIds: string[]) => Promise<void>
  applyRecordEdits: (
    env: AssistantConversationEnv,
    changeSetId: string,
    operationIds: string[],
    onProgress?: (done: number, total: number) => void
  ) => Promise<void>
  discard: (changeSetId: string) => Promise<void>
}

export const initialAssistantConversationState: AssistantConversationState = {
  ready: false,
  persistent: true,
  conversation: null,
  busy: false,
  applying: false,
  pendingProviderId: undefined,
  providerChooserOpen: false,
  history: [],
}

const NO_ACCESS = { effective: null }

type RunningTurn = { controller: AbortController; conversationId: string; userUuid: string; surveyId: number | null }

type Selection = { scope: AssistantConversationScope; conversationId: string | null }

/**
 * Returns the conversation of the state when it is the selected one (a stale one, or one still loading, is not shown).
 * @param {AssistantConversationState} state - Controller state.
 * @param {string|null} conversationId - Conversation selected in the panel.
 * @returns {Conversation|null} The shown conversation.
 */
export const selectShownConversation = (
  state: AssistantConversationState,
  conversationId: string | null
): Conversation | null =>
  conversationId !== null && state.conversation?.id === conversationId ? state.conversation : null

/**
 * Returns the key of a scope (history and the provider pick belong to it).
 * @param {AssistantConversationScope} scope - Scope.
 * @returns {string} The key.
 */
const toScopeKey = ({ userUuid, surveyId, area }: AssistantConversationScope): string =>
  `${userUuid}|${surveyId}|${area}`

/**
 * Creates the conversation of a first message. A Cleaning conversation has record content from its first turn, so
 * it starts as `data`: the engine is selected for `data` already for that turn.
 * @param {AssistantConversationScope} scope - User, survey and area.
 * @returns {Conversation} The new conversation.
 */
const createNewConversation = ({ userUuid, surveyId, area }: AssistantConversationScope): Conversation => {
  const created = createConversation({ userUuid, surveyId, area })
  return startsAsDataConversation(area)
    ? escalateConversationDataClass({ conversation: created, dataClass: 'data' })
    : created
}

/**
 * Creates the controller of the panel's conversation.
 * @param {AssistantConversationDeps} deps - The store, the panel, the registry and the app services.
 * @returns {AssistantConversationController} The controller.
 */
export const createAssistantConversationController = (
  deps: AssistantConversationDeps
): AssistantConversationController => {
  const { panel, registry, suggestions, cards } = deps
  let state = initialAssistantConversationState
  const listeners = new Set<() => void>()
  let conversationStore: ConversationStore | null = null
  let initPromise: Promise<void> | null = null
  // the turn whose answer is live (its streaming answer is not a leftover of a closed tab)
  let running: RunningTurn | null = null
  let selection: Selection | null = null
  // the load of the selected conversation: a newer selection cancels it, a send waits for it
  let loadToken = 0
  let loading: Promise<void> | null = null
  // latest loadHistory request: an older, slower one must not overwrite a newer list
  let historyRequest = 0
  let scopeKey: string | null = null

  /**
   * Merges changes into the state and notifies the listeners.
   * @param {Partial<AssistantConversationState>} changes - State changes.
   * @returns {void}
   */
  const set = (changes: Partial<AssistantConversationState>) => {
    state = { ...state, ...changes }
    for (const listener of listeners) listener()
  }

  const getShown = (): Conversation | null => selectShownConversation(state, panel.getState().conversationId)

  /**
   * Ends the running turn for the UI: it is no longer the live one, so it neither shows nor frees `busy` again.
   * @returns {RunningTurn|null} The turn that ended, if any.
   */
  const releaseTurn = (): RunningTurn | null => {
    const turn = running
    running = null
    if (turn) set({ busy: false })
    return turn
  }

  const stop = () => running?.controller.abort()

  const abortRunning = () => releaseTurn()?.controller.abort()

  const setScope = (scope: AssistantConversationScope) => {
    const key = toScopeKey(scope)
    const previousKey = scopeKey
    scopeKey = key
    // a turn of another user or survey is no longer shown: stopping it must not leave the new survey busy
    if (running && (running.userUuid !== scope.userUuid || running.surveyId !== scope.surveyId)) abortRunning()
    if (previousKey === key) return
    historyRequest += 1
    set({ history: [], pendingProviderId: undefined, providerChooserOpen: false })
  }

  /**
   * Reads the selected conversation and decides what the panel does with it.
   * @param {ConversationStore} store - Conversation store.
   * @param {object} selected - The selection.
   * @param {AssistantConversationScope} selected.scope - User, survey and area of the panel.
   * @param {string} selected.conversationId - Conversation to read.
   * @returns {Promise<{loaded: Conversation|null, decision: LoadedConversationDecision}>} The conversation and decision.
   */
  const readSelected = async (
    store: ConversationStore,
    { scope, conversationId }: { scope: AssistantConversationScope; conversationId: string }
  ): Promise<{ loaded: Conversation | null; decision: LoadedConversationDecision }> => {
    try {
      // null for a conversation of another user (a shared browser)
      const loaded = await store.get(conversationId, scope.userUuid)
      const decision = decideLoadedConversation({
        loaded,
        conversationId,
        runningId: running?.conversationId ?? null,
        scope,
      })
      return { loaded, decision }
    } catch (error) {
      // a conversation that can't be read is left: it stays in the list, the chat starts blank
      logAiWarning('The stored conversation could not be read', error)
      return { loaded: null, decision: 'forget' }
    }
  }

  /**
   * Loads the selected conversation, unless it is the one in memory.
   * @returns {void}
   */
  const loadSelection = () => {
    loadToken += 1
    loading = null
    if (!selection || !conversationStore) return
    const { scope, conversationId } = selection
    if (!conversationId) {
      // left: it is read from the store when opened again (a running turn keeps its conversation)
      if (state.conversation && running?.conversationId !== state.conversation.id) set({ conversation: null })
      return
    }
    if (state.conversation?.id === conversationId) return
    const token = loadToken
    const load = readSelected(conversationStore, { scope, conversationId }).then(({ loaded, decision }) => {
      if (token !== loadToken || panel.getState().conversationId !== conversationId) return
      if (decision === 'show' && loaded) {
        set({ conversation: normalizeLoadedConversation(loaded, running?.conversationId === loaded.id) })
      } else if (decision === 'forget') {
        panel.setConversationId(null)
      }
    })
    loading = load
    void load.then(() => {
      if (loading === load) loading = null
    })
  }

  const select = (scope: AssistantConversationScope, conversationId: string | null) => {
    selection = { scope, conversationId }
    loadSelection()
  }

  const init = (): Promise<void> => {
    initPromise ??= deps.getStore().then(
      (store) => {
        conversationStore = store
        set({ ready: true, persistent: store.persistent })
        loadSelection()
      },
      () => {
        // not open: the panel stays not ready
        initPromise = null
      }
    )
    return initPromise
  }

  /**
   * Runs one turn on a base conversation, saving it when it starts and when it ends.
   * @param {AssistantConversationEnv} env - What the turn reads from the app.
   * @param {Conversation} base - Conversation before the turn.
   * @param {string} text - User message.
   * @param {string} [displayText] - What the chat shows instead of the user message.
   * @returns {Promise<void>} Resolves when the turn ends.
   */
  const executeTurn = async (env: AssistantConversationEnv, base: Conversation, text: string, displayText?: string) => {
    const store = conversationStore
    if (!store) return
    const controller = new AbortController()
    const generation = registry.getGeneration()
    const turn: RunningTurn = {
      controller,
      conversationId: base.id,
      userUuid: env.userUuid,
      surveyId: env.surveyId,
    }
    running = turn
    registry.register(controller)
    // a stopped, replaced or reset (logout) turn must not bring back a conversation the user left: UI only
    const isCurrent = () =>
      running === turn &&
      canShowAfterSave({
        startedGeneration: generation,
        currentGeneration: registry.getGeneration(),
        selectedId: panel.getState().conversationId,
        id: base.id,
      })
    // the copy in memory of a turn that ends while another area is shown must not stay a streaming snapshot: the
    // panel keeps showing it when the area is selected again, without reading the store
    const holdsCopy = () =>
      running === turn && registry.getGeneration() === generation && state.conversation?.id === base.id
    // always saved, even after a reset: the stored conversation keeps its own user and the last state of the answer
    const persist = (next: Conversation) => registry.track(store.save(next))
    set({ busy: true, conversation: base })
    panel.setConversationId(base.id)
    let saved = false
    try {
      const access = await deps
        .loadAccess({ surveyId: env.area === 'help' ? null : env.surveyId })
        .catch(() => NO_ACCESS)
      const final = await deps.runTurn({
        conversation: base,
        userMessage: text,
        displayText,
        area: env.area,
        ctx: env.buildToolContext(env.area),
        access,
        signal: controller.signal,
        onUpdate: (next) => {
          if (isCurrent()) set({ conversation: next })
          if (!saved) {
            saved = true
            void persist(next)
          }
        },
      })
      if (isCurrent() || holdsCopy()) set({ conversation: final })
      suggestions.reportSettle({ conversation: final, running: false })
      await persist(final)
    } catch (error) {
      // an unexpected failure (not the model's: runAssistantTurn reports those in the answer): no spinner is left
      if ((isCurrent() || holdsCopy()) && state.conversation) {
        set({ conversation: withStreamingFailed(state.conversation) })
      }
      throw error
    } finally {
      registry.unregister(controller)
      if (running === turn) releaseTurn()
    }
  }

  // tracked as a whole: logout waits for the final save of an aborted turn too
  const runTurn = (env: AssistantConversationEnv, base: Conversation, text: string, displayText?: string) => {
    // never rejects: the failure is shown on the answer and logged, and nobody awaits the turn
    const turn = executeTurn(env, base, text, displayText).catch((error: unknown) =>
      logAiWarning('The assistant turn failed', error)
    )
    if (base.suggestionScope) suggestions.holdTurnLock({ conversationId: base.id, done: turn })
    return registry.track(turn)
  }

  /**
   * Starts the turn of a message: in the selected conversation, or in a new one.
   * @param {AssistantConversationEnv} env - What the turn reads from the app.
   * @param {string} text - User message.
   * @param {AssistantSendOptions} options - Suggestion and display text.
   * @returns {string|null} The conversation id, or null when nothing was sent.
   */
  const startSend = (
    env: AssistantConversationEnv,
    text: string,
    { suggestion, displayText }: AssistantSendOptions
  ): string | null => {
    if (!conversationStore || state.busy || state.applying) return null
    const selectedId = panel.getState().conversationId
    const selected = selectShownConversation(state, selectedId)
    // a remembered conversation that is not loaded: a new one must not silently take its place
    if (selectedId && !selected && !suggestion) return null
    const created = createNewConversation(env)
    const fresh = state.pendingProviderId
      ? withConversationProvider({ conversation: created, providerId: state.pendingProviderId })
      : created
    const base = suggestion ? suggestions.withScope(fresh, suggestion.scope) : (selected ?? fresh)
    // the pick belongs to the conversation it created: later new chats start from the default
    set({ pendingProviderId: undefined })
    // the turn shows and selects its conversation synchronously, before its first await
    void runTurn(env, base, text, displayText)
    return base.id
  }

  // waits for the load of the selected conversation (a newer selection starts another one)
  const whenLoaded = (): Promise<void> => (loading ? loading.then(whenLoaded) : Promise.resolve())

  const send = (env: AssistantConversationEnv, text: string, options: AssistantSendOptions = {}) => {
    if (!conversationStore) return Promise.resolve(null)
    // the remembered conversation is loading: the message goes into it once it is there
    if (loading) {
      return whenLoaded().then(() => {
        // the area, survey or user changed while waiting: the message belongs to the context it was typed in
        if (scopeKey !== null && scopeKey !== toScopeKey(env)) return null
        return startSend(env, text, options)
      })
    }
    return Promise.resolve(startSend(env, text, options))
  }

  const retry = (env: AssistantConversationEnv) => {
    const shown = getShown()
    const retryBase = shown ? getRetryBase(shown) : null
    if (retryBase && !state.busy && !state.applying)
      void runTurn(env, retryBase.base, retryBase.text, retryBase.displayText)
  }

  const chooseProvider = (providerId: string) => {
    // a turn or a card action rewrites the conversation: a pick meanwhile would be lost
    if (state.busy || state.applying) return
    const shown = getShown()
    // the conversation is still loading: a pick would be lost
    if (panel.getState().conversationId && !shown) return
    if (!shown) {
      set({ pendingProviderId: providerId })
      return
    }
    const next = withConversationProvider({ conversation: shown, providerId })
    set({ conversation: next })
    // tracked: logout waits for the save
    if (conversationStore) void registry.track(conversationStore.save(next)).catch(() => undefined)
  }

  const setProviderChooserOpen = (providerChooserOpen: boolean) => set({ providerChooserOpen })

  // a blank chat: the conversation is created by its first message
  const newConversation = () => {
    set({ pendingProviderId: undefined, providerChooserOpen: false })
    panel.startNewConversation()
  }

  const openConversation = (id: string) => {
    set({ pendingProviderId: undefined, providerChooserOpen: false })
    panel.setConversationId(id)
  }

  const loadHistory = async (scope: AssistantConversationScope) => {
    // the render that asks knows the newest scope: its children's effects run before the panel host's
    setScope(scope)
    // and before the host opened the store: wait for it (a store that can't open leaves the list as it is)
    await init()
    if (!conversationStore) return
    historyRequest += 1
    const request = historyRequest
    const key = toScopeKey(scope)
    try {
      const all = await conversationStore.list({ userUuid: scope.userUuid, surveyId: scope.surveyId })
      // dropped when a newer request started, or the scope changed meanwhile
      if (request === historyRequest && key === scopeKey)
        set({ history: all.filter((item) => item.area === scope.area) })
    } catch {
      // the list stays as it was
    }
  }

  const clearConversations = async ({ userUuid }: AssistantConversationScope) => {
    if (!conversationStore) return
    // all the conversations of the user, whatever the area and the survey; a failure leaves the list and the chat as
    // they were and reaches the caller, who tells the user
    await deps.clearUserData({ conversationStore, userUuid })
    set({ history: [], conversation: null })
    panel.setConversationId(null)
  }

  const deleteConversation = async ({ userUuid }: AssistantConversationScope, id: string) => {
    if (!conversationStore) return
    // a failure leaves the list as it was and reaches the caller, who tells the user
    await conversationStore.remove(id, userUuid)
    // a deleted Do it conversation can never settle: its suggestion targets show again
    suggestions.onConversationSettled({ userUuid, conversationId: id, outcome: 'failed' })
    set({ history: state.history.filter((item) => item.id !== id) })
    if (panel.getState().conversationId !== id) return
    // forgets it as the area's open conversation (home page), then back to the list
    panel.setConversationId(null)
    panel.showHistory()
  }

  /**
   * Saves a conversation (tracked, so logout can wait for it) and shows it when it is the selected one.
   * @param {Conversation} next - Conversation.
   * @param {number} generation - Registry generation when the work started (after a reset it is saved, not shown).
   * @returns {Promise<void>} Resolves when saved.
   */
  const saveShown = async (next: Conversation, generation: number) => {
    const selectedId = panel.getState().conversationId
    if (
      canShowAfterSave({
        startedGeneration: generation,
        currentGeneration: registry.getGeneration(),
        selectedId,
        id: next.id,
      })
    ) {
      set({ conversation: next })
    }
    await registry.track(conversationStore?.save(next) ?? Promise.resolve())
    // an Apply or Discard may settle the last pending card of a Do it conversation
    suggestions.reportSettle({ conversation: next })
  }

  /**
   * Reads a conversation by id: the one in memory, or the stored one of the user of the panel.
   * @param {string} id - Conversation id.
   * @returns {Promise<Conversation|null>} The conversation.
   */
  const readConversation = async (id: string): Promise<Conversation | null> => {
    if (state.conversation?.id === id) return state.conversation
    const userUuid = selection?.scope.userUuid
    if (!conversationStore || !userUuid) return null
    return (await conversationStore.get(id, userUuid)) ?? null
  }

  /**
   * Runs an Apply or Discard of a card unless another one runs (also blocks new turns meanwhile). It is tracked, so
   * logout waits for the results to be saved.
   * @param {Function} action - Receives the conversation id and the registry generation.
   * @returns {Promise<void>} Resolves when done.
   */
  const runCardAction = async (action: (id: string, generation: number) => Promise<void>) => {
    const id = getShown()?.id
    if (state.busy || !id || state.applying) return
    set({ applying: true })
    try {
      await registry.track(action(id, registry.getGeneration()))
    } finally {
      set({ applying: false })
    }
  }

  /**
   * Writes the results of a card into the conversation that was applied (the user may have switched meanwhile).
   * @param {object} params - Parameters.
   * @param {string} params.id - Conversation id.
   * @param {string} params.changeSetId - Card.
   * @param {CardApplyOutcome} params.outcome - Results and the note for the model.
   * @param {number} params.generation - Registry generation when the action started.
   * @returns {Promise<void>} Resolves when saved.
   */
  const writeOutcome = async ({
    id,
    changeSetId,
    outcome,
    generation,
  }: {
    id: string
    changeSetId: string
    outcome: CardApplyOutcome
    generation: number
  }) => {
    const current = await readConversation(id)
    if (current) await saveShown(withApplyResults({ conversation: current, changeSetId, ...outcome }), generation)
  }

  const apply = (changeSetId: string, operationIds: string[]) =>
    runCardAction(async (id, generation) => {
      const cardState = (await readConversation(id))?.changeSets[changeSetId]
      if (!cardState) return
      const outcome = await cards.applyOperations({ changeSet: cardState.changeSet, operationIds })
      if (outcome) await writeOutcome({ id, changeSetId, outcome, generation })
    })

  const applyRecordEdits = (
    { cycle, lang }: AssistantConversationEnv,
    changeSetId: string,
    operationIds: string[],
    onProgress?: (done: number, total: number) => void
  ) =>
    runCardAction(async (id, generation) => {
      try {
        const cardState = (await readConversation(id))?.changeSets[changeSetId]
        if (!cardState) return
        // no abort on unmount: the server keeps writing, and the results are saved by conversation id
        const outcome = await cards.applyRecordEdits({
          changeSet: cardState.changeSet,
          operationIds,
          cycle,
          lang,
          onProgress,
        })
        await writeOutcome({ id, changeSetId, outcome, generation })
      } catch {
        // the conversation can't be read or saved (store error): there is no card to update, and nothing to retry
      }
    })

  const discard = (changeSetId: string) =>
    runCardAction(async (id, generation) => {
      const current = await readConversation(id)
      if (current) await saveShown(withDiscarded({ conversation: current, changeSetId }), generation)
    })

  return {
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getState: () => state,
    init,
    abortRunning,
    setScope,
    select,
    send,
    stop,
    retry,
    chooseProvider,
    setProviderChooserOpen,
    newConversation,
    openConversation,
    loadHistory,
    clearConversations,
    deleteConversation,
    apply,
    applyRecordEdits,
    discard,
  }
}
