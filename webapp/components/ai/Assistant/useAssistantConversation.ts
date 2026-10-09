import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from 'react-redux'

import * as User from '@core/user/user'

import { runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import { applierDepsReady, createApplierDeps } from '@webapp/ai/changeSets/applierDeps'
import { applyChangeSet } from '@webapp/ai/changeSets/applyChangeSet'
import { summarizeResults } from '@webapp/ai/changeSets/describeOperation'
import { getEngineChangeNotice } from '@webapp/ai/engines/assistantEngine'
import { toDataLocation } from '@webapp/ai/engines/featureAvailability'
import type { AiSelectedEngine } from '@webapp/ai/engines/types'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { getConversationStore, type ConversationStore } from '@webapp/ai/conversations/conversationStore'
import type { Conversation } from '@webapp/ai/conversations/types'
import type { AiDataLocation } from '@webapp/ai/policy/aiFeatureAvailability'
import { loadPolicyContext } from '@webapp/ai/policy/policyContext'
import { useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import type { AssistantArea } from './assistantAreas'
import { getRetryBase, normalizeLoadedConversation, withApplyResults, withDiscarded } from './assistantPanelModel'
import { assistantPanelStore } from './assistantPanelStore'
import { assistantTurnRegistry } from './assistantTurnRegistry'
import { useAssistantToolContext } from './useAssistantToolContext'

export type AssistantConversationApi = {
  conversation: Conversation | null
  busy: boolean
  // "Now using: …" when the engine changed since the previous turn
  engineNotice: AiDataLocation | null
  // a change set card is being applied or discarded
  applying: boolean
  // false when the browser can't store conversations (memory store)
  persistent: boolean
  history: Conversation[]
  send: (text: string) => void
  stop: () => void
  retry: () => void
  newConversation: () => void
  openConversation: (id: string) => void
  loadHistory: () => Promise<void>
  clearConversations: () => Promise<void>
  apply: (changeSetId: string, operationIds: string[]) => Promise<void>
  discard: (changeSetId: string) => Promise<void>
}

const NO_ACCESS = { effective: null, hostingClass: null }

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
  const buildToolContext = useAssistantToolContext()

  const [conversationStore, setConversationStore] = useState<ConversationStore | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [busy, setBusy] = useState(false)
  const [engineNotice, setEngineNotice] = useState<AiDataLocation | null>(null)
  const [applying, setApplying] = useState(false)
  const [history, setHistory] = useState<Conversation[]>([])
  const conversationRef = useRef<Conversation | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const applyingRef = useRef(false)
  // id of the conversation whose turn is running (its streaming answer is live, not left over)
  // location of the previous turn: kept across conversations (the notice is about the engine)
  const lastLocationRef = useRef<AiDataLocation | null>(null)
  const runningIdRef = useRef<string | null>(null)

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

  // another survey or user: start over
  useEffect(() => {
    const current = conversationRef.current
    if (current && (current.surveyId !== surveyId || current.userUuid !== userUuid)) {
      controllerRef.current?.abort()
      assistantPanelStore.setConversationId(null)
    }
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
    conversationStore.get(conversationId).then((loaded) => {
      if (!active) return
      if (loaded?.userUuid === userUuid && loaded.area === area && loaded.surveyId === surveyId) {
        show(normalizeLoadedConversation(loaded, runningIdRef.current === loaded.id))
      } else assistantPanelStore.setConversationId(null)
    })
    return () => {
      active = false
    }
  }, [area, conversationId, conversationStore, show, surveyId, userUuid])

  /**
   * Runs one turn on a base conversation, saving it when it starts and when it ends.
   * @param {Conversation} base - Conversation before the turn.
   * @param {string} text - User message.
   * @returns {Promise<void>} Resolves when the turn ends.
   */
  const runTurn = useCallback(
    async (base: Conversation, text: string) => {
      if (!conversationStore) return
      const controller = new AbortController()
      const generation = assistantTurnRegistry.getGeneration()
      controllerRef.current = controller
      runningIdRef.current = base.id
      assistantTurnRegistry.register(controller)
      // a stopped or replaced turn must not bring back a conversation the user left
      const isCurrent = () =>
        controllerRef.current === controller && assistantPanelStore.getState().conversationId === base.id
      // saves are skipped after a reset (logout), which clears the store
      const persist = (next: Conversation) =>
        assistantTurnRegistry.getGeneration() === generation
          ? assistantTurnRegistry.track(conversationStore.save(next))
          : Promise.resolve()
      setBusy(true)
      show(base)
      assistantPanelStore.setConversationId(base.id)
      let saved = false
      try {
        const access = await loadPolicyContext({ surveyId: area === 'help' ? null : surveyId }).catch(() => NO_ACCESS)
        const final = await runAssistantTurn({
          conversation: base,
          userMessage: text,
          area,
          ctx: buildToolContext(area),
          access,
          onEngine: (engine: AiSelectedEngine) => {
            if (isCurrent()) setEngineNotice(getEngineChangeNotice({ previous: lastLocationRef.current, engine }))
            lastLocationRef.current = toDataLocation(engine)
          },
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

  const send = useCallback(
    (text: string) => {
      if (busy || applyingRef.current) return
      // no selected id: a new conversation, whatever the ref still holds
      const selected = conversationId && conversationRef.current?.id === conversationId ? conversationRef.current : null
      void runTurn(selected ?? createConversation({ userUuid, surveyId, area }), text)
    },
    [area, busy, conversationId, runTurn, surveyId, userUuid]
  )

  const retry = useCallback(() => {
    const retryBase = conversationRef.current ? getRetryBase(conversationRef.current) : null
    if (retryBase && !busy && !applyingRef.current) void runTurn(retryBase.base, retryBase.text)
  }, [busy, runTurn])

  const stop = useCallback(() => controllerRef.current?.abort(), [])

  const newConversation = useCallback(() => assistantPanelStore.setConversationId(null), [])

  const openConversation = useCallback((id: string) => assistantPanelStore.setConversationId(id), [])

  const listAreaConversations = useCallback(async () => {
    if (!conversationStore) return []
    const all = await conversationStore.list({ userUuid, surveyId })
    return all.filter((item) => item.area === area)
  }, [area, conversationStore, surveyId, userUuid])

  const loadHistory = useCallback(async () => setHistory(await listAreaConversations()), [listAreaConversations])

  const clearConversations = useCallback(async () => {
    if (!conversationStore) return
    // all the conversations of the user, whatever the area and the survey
    await conversationStore.clearUser(userUuid)
    setHistory([])
    assistantPanelStore.setConversationId(null)
  }, [conversationStore, userUuid])

  /**
   * Saves a conversation (tracked, so logout can wait for it) and shows it when it is the selected one.
   * @param {Conversation} next - Conversation.
   * @param {number} generation - Registry generation when the work started (a reset skips the save).
   * @returns {Promise<void>} Resolves when saved.
   */
  const saveShown = useCallback(
    async (next: Conversation, generation: number) => {
      if (assistantPanelStore.getState().conversationId === next.id) show(next)
      if (assistantTurnRegistry.getGeneration() !== generation) return
      await assistantTurnRegistry.track(conversationStore?.save(next) ?? Promise.resolve())
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
      conversationRef.current?.id === id ? conversationRef.current : ((await conversationStore?.get(id)) ?? null),
    [conversationStore]
  )

  /**
   * Runs an Apply or Discard of a card unless another one runs (also blocks new turns meanwhile).
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
        await action(id, assistantTurnRegistry.getGeneration())
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

  return {
    // a stale conversation (New conversation, or another one still loading) is not shown
    conversation: conversation?.id === conversationId ? conversation : null,
    busy,
    engineNotice,
    applying,
    persistent: conversationStore?.persistent ?? true,
    history,
    send,
    stop,
    retry,
    newConversation,
    openConversation,
    loadHistory,
    clearConversations,
    apply,
    discard,
  }
}
