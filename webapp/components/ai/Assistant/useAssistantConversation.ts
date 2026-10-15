import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useStore } from 'react-redux'

import * as User from '@core/user/user'

import type { Conversation } from '@webapp/ai/conversations/types'
import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import type { AssistantArea } from './assistantAreas'
import {
  selectShownConversation,
  type AssistantConversationController,
  type AssistantConversationEnv,
  type AssistantConversationScope,
  type AssistantSendOptions,
} from './assistantConversationController'
import { createBrowserAssistantController } from './createBrowserAssistantController'
import { useAssistantToolContext } from './useAssistantToolContext'

export type { AssistantSendOptions }

export type AssistantConversationApi = {
  conversation: Conversation | null
  busy: boolean
  // provider of the conversation (undefined: the user's default); a blank chat keeps the pick for its first message
  providerId: string | undefined
  // sets the provider of the shown conversation (saved with it), or of the next new one; ignored while a turn runs
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
  // waits for the store to open
  loadHistory: () => Promise<void>
  // rejects when the store fails: nothing was cleared
  clearConversations: () => Promise<void>
  // deletes one conversation of the list (rejects when the store fails); the open one leaves the chat on the start screen
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

type ConversationActions = Pick<
  AssistantConversationApi,
  | 'chooseProvider'
  | 'setProviderChooserOpen'
  | 'send'
  | 'stop'
  | 'retry'
  | 'newConversation'
  | 'openConversation'
  | 'loadHistory'
  | 'clearConversations'
  | 'deleteConversation'
  | 'apply'
  | 'applyRecordEdits'
  | 'discard'
>

/**
 * Binds the controller's actions to the scope and the environment of a render.
 * @param {AssistantConversationController} controller - The controller.
 * @param {AssistantConversationScope} scope - User, survey and area.
 * @param {AssistantConversationEnv} env - The scope plus what a turn reads from the app.
 * @returns {ConversationActions} The actions of the API.
 */
const bindActions = (
  controller: AssistantConversationController,
  scope: AssistantConversationScope,
  env: AssistantConversationEnv
): ConversationActions => ({
  chooseProvider: controller.chooseProvider,
  setProviderChooserOpen: controller.setProviderChooserOpen,
  send: (text, options) => controller.send(env, text, options),
  stop: controller.stop,
  retry: () => controller.retry(env),
  newConversation: controller.newConversation,
  openConversation: controller.openConversation,
  loadHistory: () => controller.loadHistory(scope),
  clearConversations: () => controller.clearConversations(scope),
  deleteConversation: (id) => controller.deleteConversation(scope, id),
  apply: controller.apply,
  applyRecordEdits: (changeSetId, operationIds, onProgress) =>
    controller.applyRecordEdits(env, changeSetId, operationIds, onProgress),
  discard: controller.discard,
})

/**
 * Conversation of the current area: a thin adapter over the conversation controller (load, turns, Stop / Retry,
 * history, Apply / Discard, all saved in the store).
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

  const [controller] = useState(() => createBrowserAssistantController(reduxStore))
  const state = useSyncExternalStore(controller.subscribe, controller.getState)
  const scope = useMemo(() => ({ userUuid, surveyId, area }), [area, surveyId, userUuid])
  const env = useMemo(() => ({ ...scope, cycle, lang, buildToolContext }), [buildToolContext, cycle, lang, scope])
  const actions = useMemo(() => bindActions(controller, scope, env), [controller, env, scope])

  useEffect(() => {
    void controller.init()
    // the panel unmounts on logout: stop the running answer
    return () => controller.abortRunning()
  }, [controller])

  // another survey or user: stop the running answer (the panel host's scope restores that survey's conversation)
  useEffect(() => {
    controller.setScope(scope)
  }, [controller, scope])

  useEffect(() => {
    controller.select(scope, conversationId)
  }, [controller, conversationId, scope])

  // a stale conversation (New conversation, or another one still loading) is not shown
  const conversation = selectShownConversation(state, conversationId)
  return {
    ...actions,
    conversation,
    busy: state.busy,
    providerId: conversation ? conversation.providerId : state.pendingProviderId,
    providerChooserOpen: state.providerChooserOpen,
    applying: state.applying,
    persistent: state.persistent,
    ready: state.ready,
    history: state.history,
  }
}
