import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from 'react-redux'

import * as User from '@core/user/user'

import { runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import { applierDepsReady, createApplierDeps } from '@webapp/ai/changeSets/applierDeps'
import { applyChangeSet } from '@webapp/ai/changeSets/applyChangeSet'
import { summarizeResults } from '@webapp/ai/changeSets/describeOperation'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { getConversationStore, type ConversationStore } from '@webapp/ai/conversations/conversationStore'
import type { Conversation } from '@webapp/ai/conversations/types'
import { loadPolicyContext } from '@webapp/ai/policy/policyContext'
import { useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import type { AssistantArea } from './assistantAreas'
import { getRetryBase, withApplyResults, withDiscarded } from './assistantPanelModel'
import { assistantPanelStore } from './assistantPanelStore'
import { useAssistantToolContext } from './useAssistantToolContext'

export type AssistantConversationApi = {
  conversation: Conversation | null
  busy: boolean
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
  const [history, setHistory] = useState<Conversation[]>([])
  const conversationRef = useRef<Conversation | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

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
      if (loaded?.userUuid === userUuid && loaded.area === area) show(loaded)
      else assistantPanelStore.setConversationId(null)
    })
    return () => {
      active = false
    }
  }, [area, conversationId, conversationStore, show, userUuid])

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
      controllerRef.current = controller
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
          signal: controller.signal,
          onUpdate: (next) => {
            show(next)
            if (!saved) {
              saved = true
              void conversationStore.save(next)
            }
          },
        })
        show(final)
        await conversationStore.save(final)
      } finally {
        controllerRef.current = null
        setBusy(false)
      }
    },
    [area, buildToolContext, conversationStore, show, surveyId]
  )

  const send = useCallback(
    (text: string) => {
      if (busy) return
      const base = conversationRef.current ?? createConversation({ userUuid, surveyId, area })
      void runTurn(base, text)
    },
    [area, busy, runTurn, surveyId, userUuid]
  )

  const retry = useCallback(() => {
    const retryBase = conversationRef.current ? getRetryBase(conversationRef.current) : null
    if (retryBase && !busy) void runTurn(retryBase.base, retryBase.text)
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
    for (const item of await listAreaConversations()) await conversationStore.remove(item.id)
    setHistory([])
    assistantPanelStore.setConversationId(null)
  }, [conversationStore, listAreaConversations])

  /**
   * Shows a conversation and saves it.
   * @param {Conversation} next - Conversation.
   * @returns {Promise<void>} Resolves when saved.
   */
  const saveShown = useCallback(
    async (next: Conversation) => {
      show(next)
      await conversationStore?.save(next)
    },
    [conversationStore, show]
  )

  /**
   * Applies the selected operations of a card and tells the model.
   * @param {string} changeSetId - Card.
   * @param {string[]} operationIds - Operations to apply.
   * @returns {Promise<void>} Resolves when done.
   */
  const apply = useCallback(
    async (changeSetId: string, operationIds: string[]) => {
      const cardState = conversationRef.current?.changeSets[changeSetId]
      const deps = createApplierDeps({ dispatch: reduxStore.dispatch, getState: reduxStore.getState })
      // the card disables Apply while the designer has an unsaved edit; checked again here
      if (busy || !cardState || !applierDepsReady(deps)) return
      const { changeSet } = cardState
      const results = await applyChangeSet({ changeSet, operationIds, deps })
      const note = summarizeResults({ changeSet, results, survey: deps.getSurvey() })
      const current = conversationRef.current as Conversation
      await saveShown(withApplyResults({ conversation: current, changeSetId, results, note }))
    },
    [busy, reduxStore, saveShown]
  )

  /**
   * Discards a card and tells the model.
   * @param {string} changeSetId - Card.
   * @returns {Promise<void>} Resolves when done.
   */
  const discard = useCallback(
    async (changeSetId: string) => {
      const current = conversationRef.current
      if (busy || !current) return
      await saveShown(withDiscarded({ conversation: current, changeSetId }))
    },
    [busy, saveShown]
  )

  return {
    // a stale conversation (New conversation, or another one still loading) is not shown
    conversation: conversation?.id === conversationId ? conversation : null,
    busy,
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
