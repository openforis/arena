import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from 'react-redux'

import { Dates } from '@openforis/arena-core'

import * as User from '@core/user/user'

import { runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import { applierDepsReady, createApplierDeps } from '@webapp/ai/changeSets/applierDeps'
import { applyChangeSet } from '@webapp/ai/changeSets/applyChangeSet'
import { summarizeRecordEditResults } from '@webapp/ai/changeSets/recordEdits/recordEditCardModel'
import {
  applyRecordEdits as applyRecordEditsRequest,
  toChunkErrorResult,
} from '@webapp/ai/changeSets/recordEdits/recordEditsApplier'
import { summarizeResults } from '@webapp/ai/changeSets/describeOperation'
import { clearUserConversations } from '@webapp/ai/conversations/clearUserConversations'
import { categoryItemRefsRegistry } from '@webapp/ai/tools/design/categoryItemRefs'
import { createConversation, withConversationProvider } from '@webapp/ai/conversations/conversationModel'
import { escalateConversationDataClass } from '@webapp/ai/conversations/dataClass'
import { getConversationStore, type ConversationStore } from '@webapp/ai/conversations/conversationStore'
import { browserOpenConversations } from '@webapp/ai/conversations/openConversations'
import type { Conversation } from '@webapp/ai/conversations/types'
import type { ChangeSet, OperationResult } from '@webapp/ai/changeSets/types'
import { logAiWarning } from '@webapp/ai/log/aiLog'
import { loadPolicyContext } from '@webapp/ai/policy/policyContext'
import {
  reportSuggestionSettle,
  withSuggestionScope,
  holdSuggestionTurnLock,
} from '@webapp/ai/suggestions/suggestionConversation'
import { suggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { SuggestionScope } from '@webapp/ai/suggestions/types'
import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import type { AssistantArea } from './assistantAreas'
import {
  canShowAfterSave,
  decideLoadedConversation,
  getRetryBase,
  normalizeLoadedConversation,
  withApplyResults,
  withDiscarded,
} from './assistantPanelModel'
import { assistantPanelStore } from './assistantPanelStore'
import { assistantTurnRegistry } from './assistantTurnRegistry'
import { startsAsDataConversation } from './cleaning/cleaningArea'
import { useAssistantToolContext } from './useAssistantToolContext'

const logUnhandled = (message: string) => (error: unknown) => logAiWarning(message, error)

// Do it: a new conversation that keeps the suggestion's scope for its tools; displayText: what the chat shows instead
// of the text (the model still gets the text)
export type AssistantSendOptions = { suggestion?: { id: string; scope: SuggestionScope }; displayText?: string }

export type AssistantConversationApi = {
  conversation: Conversation | null
  busy: boolean
  // provider of the conversation (undefined: the user's default); a blank chat keeps the pick for its first message
  providerId: string | undefined
  // sets the provider of the shown conversation (saved with it), or of the next new one
  chooseProvider: (providerId: string) => void
  // the "Answer with" popover of the composer is open (the error card's "Choose another provider" opens it)
  providerChooserOpen: boolean
  setProviderChooserOpen: (open: boolean) => void
  // a change set card is being applied or discarded
  applying: boolean
  // false when the browser can't store conversations (memory store)
  persistent: boolean
  history: Conversation[]
  // the conversation store is open (a suggestion request waits for it)
  ready: boolean
  // resolves with the conversation id once the turn was created; null when nothing was sent (busy, applying, not ready)
  send: (text: string, options?: AssistantSendOptions) => Promise<string | null>
  stop: () => void
  retry: () => void
  newConversation: () => void
  openConversation: (id: string) => void
  loadHistory: () => Promise<void>
  clearConversations: () => Promise<void>
  // deletes one conversation of the list; the open one leaves the chat on the start screen
  deleteConversation: (id: string) => Promise<void>
  apply: (changeSetId: string, operationIds: string[]) => Promise<void>
  // record-edit card: sends the edits to the batch endpoint (onProgress: chunks done, chunks total) and stores the results
  applyRecordEdits: (
    changeSetId: string,
    operationIds: string[],
    onProgress?: (done: number, total: number) => void
  ) => Promise<void>
  discard: (changeSetId: string) => Promise<void>
}

const NO_ACCESS = { effective: null }

/**
 * Creates the conversation of a first message. A Cleaning conversation has record content from its first turn, so
 * it starts as `data`: the engine is selected for `data` already for that turn.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - User.
 * @param {number|null} params.surveyId - Survey.
 * @param {AssistantArea} params.area - Area.
 * @returns {Conversation} The new conversation.
 */
const createNewConversation = (params: {
  userUuid: string
  surveyId: number | null
  area: AssistantArea
}): Conversation => {
  const created = createConversation(params)
  return startsAsDataConversation(params.area)
    ? escalateConversationDataClass({ conversation: created, dataClass: 'data' })
    : created
}

/**
 * Conversation of the current area: load, turns, Stop / Retry, history, Apply / Discard, all saved in the store.
 * @param {object} params - Parameters.
 * @param {AssistantArea} params.area - Current area.
 * @param {string|null} params.conversationId - Conversation shown (panel store).
 * @returns {AssistantConversationApi} State and actions.
 */
export const useAssistantConversation = ({
  area,
  conversationId,
}: {
  area: AssistantArea
  conversationId: string | null
}): AssistantConversationApi => {
  const reduxStore = useStore()
  const userUuid: string = User.getUuid(useUser())
  const surveyId: number | null = useSurveyId() ?? null
  const cycle: string = useSurveyCycleKey()
  const lang: string = useSurveyPreferredLang()
  const buildToolContext = useAssistantToolContext()

  const [conversationStore, setConversationStore] = useState<ConversationStore | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [busy, setBusy] = useState(false)
  // a provider picked in a blank chat, for the conversation its first message creates
  const [pendingProviderId, setPendingProviderId] = useState<string | undefined>(undefined)
  const [providerChooserOpen, setProviderChooserOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const [history, setHistory] = useState<Conversation[]>([])
  const conversationRef = useRef<Conversation | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const applyingRef = useRef(false)
  // id of the conversation whose turn is running (its streaming answer is live, not left over)
  const runningIdRef = useRef<string | null>(null)
  // latest loadHistory request: an older, slower one must not overwrite a newer list
  const historyRequestRef = useRef(0)

  const show = useCallback((next: Conversation | null) => {
    conversationRef.current = next
    setConversation(next)
  }, [])

  useEffect(() => {
    let active = true
    getConversationStore().then((store) => {
      if (active) setConversationStore(store)
    })
    return () => {
      active = false
    }
  }, [])

  // the panel unmounts on logout: stop the running answer
  useEffect(() => () => controllerRef.current?.abort(), [])

  // another survey or user: stop the running answer (the panel host's scope restores that survey's conversation)
  useEffect(() => {
    const current = conversationRef.current
    if (current && (current.surveyId !== surveyId || current.userUuid !== userUuid)) controllerRef.current?.abort()
  }, [surveyId, userUuid])

  useEffect(() => {
    if (!conversationStore) return undefined
    if (!conversationId) {
      // the conversation state is hidden below while no id is selected
      conversationRef.current = null
      return undefined
    }
    if (conversationRef.current?.id === conversationId) return undefined
    let active = true
    conversationStore.get(conversationId, userUuid).then((loaded) => {
      if (!active) return
      const decision = decideLoadedConversation({
        loaded,
        conversationId,
        runningId: runningIdRef.current,
        scope: { userUuid, area, surveyId },
      })
      if (decision === 'show' && loaded) show(normalizeLoadedConversation(loaded, runningIdRef.current === loaded.id))
      else if (decision === 'forget') assistantPanelStore.setConversationId(null)
    }, logUnhandled('The stored conversation could not be read'))
    return () => {
      active = false
    }
  }, [area, conversationId, conversationStore, show, surveyId, userUuid])

  /**
   * Runs one turn on a base conversation, saving it when it starts and when it ends.
   * @param {Conversation} base - Conversation before the turn.
   * @param {string} text - User message.
   * @param {string} [displayText] - What the chat shows instead of the user message.
   * @returns {Promise<void>} Resolves when the turn ends.
   */
  const executeTurn = useCallback(
    async (base: Conversation, text: string, displayText?: string) => {
      if (!conversationStore) return
      const controller = new AbortController()
      const generation = assistantTurnRegistry.getGeneration()
      controllerRef.current = controller
      runningIdRef.current = base.id
      assistantTurnRegistry.register(controller)
      // a stopped, replaced or reset (logout) turn must not bring back a conversation the user left: UI only
      const isCurrent = () =>
        controllerRef.current === controller &&
        canShowAfterSave({
          startedGeneration: generation,
          currentGeneration: assistantTurnRegistry.getGeneration(),
          selectedId: assistantPanelStore.getState().conversationId,
          id: base.id,
        })
      // always saved, even after a reset: the stored conversation keeps its own user and the last state of the answer
      const persist = (next: Conversation) => assistantTurnRegistry.track(conversationStore.save(next))
      setBusy(true)
      show(base)
      assistantPanelStore.setConversationId(base.id)
      let saved = false
      try {
        const access = await loadPolicyContext({ surveyId: area === 'help' ? null : surveyId }).catch(() => NO_ACCESS)
        const final = await runAssistantTurn({
          conversation: base,
          userMessage: text,
          displayText,
          area,
          ctx: buildToolContext(area),
          access,
          signal: controller.signal,
          onUpdate: (next) => {
            if (isCurrent()) show(next)
            if (!saved) {
              saved = true
              void persist(next)
            }
          },
        })
        if (isCurrent()) show(final)
        // a Do it conversation: its targets settle once no card is pending, or show again when it made no card;
        // reported before the save, so a failed save does not skip it
        reportSuggestionSettle({ conversation: final, running: false })
        await persist(final)
      } finally {
        assistantTurnRegistry.unregister(controller)
        if (controllerRef.current === controller) {
          controllerRef.current = null
          runningIdRef.current = null
          setBusy(false)
        }
      }
    },
    [area, buildToolContext, conversationStore, show, surveyId]
  )

  // tracked as a whole: logout waits for the final save of an aborted turn too
  const runTurn = useCallback(
    (base: Conversation, text: string, displayText?: string) => {
      const turn = executeTurn(base, text, displayText)
      // a Do it conversation: other tabs see its turn as running while the lock is held
      if (base.suggestionScope) holdSuggestionTurnLock({ conversationId: base.id, done: turn })
      return assistantTurnRegistry.track(turn)
    },
    [executeTurn]
  )

  const send = useCallback(
    (text: string, { suggestion, displayText }: AssistantSendOptions = {}): Promise<string | null> => {
      if (!conversationStore || busy || applyingRef.current) return Promise.resolve(null)
      // no selected id: a new conversation, whatever the ref still holds
      const selected = conversationId && conversationRef.current?.id === conversationId ? conversationRef.current : null
      const created = createNewConversation({ userUuid, surveyId, area })
      const fresh = pendingProviderId
        ? withConversationProvider({ conversation: created, providerId: pendingProviderId })
        : created
      const base = suggestion ? withSuggestionScope(fresh, suggestion.scope) : (selected ?? fresh)
      // the pick belongs to the conversation it created: later new chats start from the default
      setPendingProviderId(undefined)
      // the turn shows and selects its conversation synchronously, before its first await
      runTurn(base, text, displayText).catch(logUnhandled('The assistant turn failed'))
      return Promise.resolve(base.id)
    },
    [area, busy, conversationId, conversationStore, pendingProviderId, runTurn, surveyId, userUuid]
  )

  const retry = useCallback(() => {
    const retryBase = conversationRef.current ? getRetryBase(conversationRef.current) : null
    if (retryBase && !busy && !applyingRef.current) {
      runTurn(retryBase.base, retryBase.text, retryBase.displayText).catch(logUnhandled('The assistant turn failed'))
    }
  }, [busy, runTurn])

  const stop = useCallback(() => controllerRef.current?.abort(), [])

  /**
   * Sets the provider of the shown conversation (saved with it), or of the next new one.
   * @param {string} providerId - Provider id.
   * @returns {void} Nothing.
   */
  const chooseProvider = useCallback(
    (providerId: string) => {
      const shown = conversationId && conversationRef.current?.id === conversationId ? conversationRef.current : null
      // the conversation is still loading: a pick would be lost
      if (conversationId && !shown) return
      if (!shown) {
        setPendingProviderId(providerId)
        return
      }
      const next = withConversationProvider({ conversation: shown, providerId })
      show(next)
      // tracked: logout waits for the save
      if (conversationStore) void assistantTurnRegistry.track(conversationStore.save(next))
    },
    [conversationId, conversationStore, show]
  )

  // a blank chat: the conversation is created by its first message
  const newConversation = useCallback(() => {
    setPendingProviderId(undefined)
    setProviderChooserOpen(false)
    assistantPanelStore.startNewConversation()
  }, [])

  const openConversation = useCallback((id: string) => {
    setPendingProviderId(undefined)
    setProviderChooserOpen(false)
    assistantPanelStore.setConversationId(id)
  }, [])

  const listAreaConversations = useCallback(async () => {
    if (!conversationStore) return []
    const all = await conversationStore.list({ userUuid, surveyId })
    return all.filter((item) => item.area === area)
  }, [area, conversationStore, surveyId, userUuid])

  // another area, survey or user: the previous list is not shown while the new one loads
  const historyScope = `${userUuid}|${surveyId}|${area}`
  // set while rendering: the children's effects (loadHistory) run before this hook's effects
  const historyScopeRef = useRef(historyScope)
  historyScopeRef.current = historyScope
  useEffect(() => {
    setHistory([])
  }, [historyScope])

  const loadHistory = useCallback(async () => {
    historyRequestRef.current += 1
    const request = historyRequestRef.current
    const scope = historyScopeRef.current
    const items = await listAreaConversations()
    // dropped when a newer request started, or the scope changed meanwhile
    if (request === historyRequestRef.current && scope === historyScopeRef.current) setHistory(items)
  }, [listAreaConversations])

  const clearConversations = useCallback(async () => {
    if (!conversationStore) return
    // all the conversations of the user, whatever the area and the survey, and the open ones of every area
    await clearUserConversations({
      conversationStore,
      openConversations: browserOpenConversations,
      suggestions: suggestionStore,
      userUuid,
    })
    categoryItemRefsRegistry.clearAll()
    setHistory([])
    assistantPanelStore.setConversationId(null)
  }, [conversationStore, userUuid])

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!conversationStore) return
      await conversationStore.remove(id, userUuid)
      // a deleted Do it conversation can never settle: its suggestion targets show again
      suggestionStore.onConversationSettled({ userUuid, conversationId: id, outcome: 'failed' })
      setHistory((items) => items.filter((item) => item.id !== id))
      if (assistantPanelStore.getState().conversationId !== id) return
      // forgets it as the area's open conversation (home page), then back to the list
      assistantPanelStore.setConversationId(null)
      assistantPanelStore.showHistory()
    },
    [conversationStore, userUuid]
  )

  /**
   * Saves a conversation (tracked, so logout can wait for it) and shows it when it is the selected one.
   * @param {Conversation} next - Conversation.
   * @param {number} generation - Registry generation when the work started (after a reset it is saved, not shown).
   * @returns {Promise<void>} Resolves when saved.
   */
  const saveShown = useCallback(
    async (next: Conversation, generation: number) => {
      const selectedId = assistantPanelStore.getState().conversationId
      const currentGeneration = assistantTurnRegistry.getGeneration()
      if (canShowAfterSave({ startedGeneration: generation, currentGeneration, selectedId, id: next.id })) show(next)
      await assistantTurnRegistry.track(conversationStore?.save(next) ?? Promise.resolve())
      // an Apply or Discard may settle the last pending card of a Do it conversation
      reportSuggestionSettle({ conversation: next })
    },
    [conversationStore, show]
  )

  /**
   * Reads a conversation by id: the shown one, or the stored one.
   * @param {string} id - Conversation id.
   * @returns {Promise<Conversation|null>} The conversation.
   */
  const readConversation = useCallback(
    async (id: string): Promise<Conversation | null> =>
      conversationRef.current?.id === id
        ? conversationRef.current
        : ((await conversationStore?.get(id, userUuid)) ?? null),
    [conversationStore, userUuid]
  )

  /**
   * Runs an Apply or Discard of a card unless another one runs (also blocks new turns meanwhile). It is tracked, so
   * logout waits for the results to be saved.
   * @param {Function} action - Receives the conversation id and the registry generation.
   * @returns {Promise<void>} Resolves when done.
   */
  const runCardAction = useCallback(
    async (action: (id: string, generation: number) => Promise<void>) => {
      const id = conversationRef.current?.id
      if (busy || !id || applyingRef.current) return
      applyingRef.current = true
      setApplying(true)
      try {
        await assistantTurnRegistry.track(action(id, assistantTurnRegistry.getGeneration()))
      } finally {
        applyingRef.current = false
        setApplying(false)
      }
    },
    [busy]
  )

  /**
   * Applies the selected operations of a card and tells the model.
   * @param {string} changeSetId - Card.
   * @param {string[]} operationIds - Operations to apply.
   * @returns {Promise<void>} Resolves when done.
   */
  const apply = useCallback(
    (changeSetId: string, operationIds: string[]) =>
      runCardAction(async (id, generation) => {
        const cardState = (await readConversation(id))?.changeSets[changeSetId]
        const deps = createApplierDeps({ dispatch: reduxStore.dispatch, getState: reduxStore.getState })
        // the card disables Apply while the designer has an unsaved edit; checked again here
        if (!cardState || !applierDepsReady(deps)) return
        const { changeSet } = cardState
        const results = await applyChangeSet({ changeSet, operationIds, deps })
        const note = summarizeResults({ changeSet, results, survey: deps.getSurvey() })
        // the user may have switched conversation meanwhile: write the results into the one that was applied
        const current = await readConversation(id)
        if (current)
          await saveShown(withApplyResults({ conversation: current, changeSetId, results, note }), generation)
      }),
    [readConversation, reduxStore, runCardAction, saveShown]
  )

  /**
   * Applies the selected edits of a record-edit card through the batch endpoint and tells the model.
   * @param {string} changeSetId - Card.
   * @param {string[]} operationIds - Edits to apply.
   * @param {Function} [onProgress] - Called with (chunks done, chunks total).
   * @returns {Promise<void>} Resolves when done.
   */
  const applyRecordEdits = useCallback(
    (changeSetId: string, operationIds: string[], onProgress?: (done: number, total: number) => void) =>
      runCardAction(async (id, generation) => {
        let changeSet: ChangeSet | undefined
        let results: OperationResult[]
        try {
          const cardState = (await readConversation(id))?.changeSets[changeSetId]
          if (!cardState) return
          changeSet = cardState.changeSet
          // no abort on unmount: the server keeps writing, and the results are saved by conversation id
          results = await applyRecordEditsRequest({
            changeSet,
            operationIds,
            cycle,
            timezoneOffset: Dates.getTimezoneOffset(),
            lang,
            onProgress,
          })
        } catch (error) {
          // the conversation could not be read: there is no card to update
          if (!changeSet) return
          // the card shows the edits as failed instead of an unhandled rejection
          results = operationIds.map((operationId) => toChunkErrorResult(operationId, error))
        }
        try {
          const note = summarizeRecordEditResults({ changeSet, results })
          // the user may have switched conversation meanwhile: write the results into the one that was applied
          const current = await readConversation(id)
          if (current)
            await saveShown(withApplyResults({ conversation: current, changeSetId, results, note }), generation)
        } catch {
          // the conversation can't be saved (store error): there is no card to update, and nothing to retry
        }
      }),
    [cycle, lang, readConversation, runCardAction, saveShown]
  )

  /**
   * Discards a card and tells the model.
   * @param {string} changeSetId - Card.
   * @returns {Promise<void>} Resolves when done.
   */
  const discard = useCallback(
    (changeSetId: string) =>
      runCardAction(async (id, generation) => {
        const current = await readConversation(id)
        if (current) await saveShown(withDiscarded({ conversation: current, changeSetId }), generation)
      }),
    [readConversation, runCardAction, saveShown]
  )

  // a stale conversation (New conversation, or another one still loading) is not shown
  const shownConversation = conversation?.id === conversationId ? conversation : null
  return {
    conversation: shownConversation,
    busy,
    providerId: shownConversation ? shownConversation.providerId : pendingProviderId,
    chooseProvider,
    providerChooserOpen,
    setProviderChooserOpen,
    applying,
    persistent: conversationStore?.persistent ?? true,
    ready: conversationStore !== null,
    history,
    send,
    stop,
    retry,
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
