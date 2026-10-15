/**
 * The conversation controller wired to the browser: IndexedDB conversations, the panel store, the module registry and
 * the suggestion store.
 */
import { runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import { clearUserConversations } from '@webapp/ai/conversations/clearUserConversations'
import { getConversationStore } from '@webapp/ai/conversations/conversationStore'
import { browserOpenConversations } from '@webapp/ai/conversations/openConversations'
import { loadPolicyContext } from '@webapp/ai/policy/policyContext'
import {
  holdSuggestionTurnLock,
  reportSuggestionSettle,
  withSuggestionScope,
} from '@webapp/ai/suggestions/suggestionConversation'
import { suggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import { categoryItemRefsRegistry } from '@webapp/ai/tools/design/categoryItemRefs'

import { createCardAppliers } from './assistantCardAppliers'
import {
  createAssistantConversationController,
  type AssistantConversationController,
} from './assistantConversationController'
import { assistantPanelStore } from './assistantPanelStore'
import { assistantTurnRegistry } from './assistantTurnRegistry'

/**
 * Creates the controller of one panel.
 * @param {object} reduxStore - The app store (the designer's appliers use it).
 * @param {Function} reduxStore.dispatch - Dispatch.
 * @param {Function} reduxStore.getState - Get state.
 * @returns {AssistantConversationController} The controller.
 */
export const createBrowserAssistantController = (reduxStore: {
  dispatch: (action: any) => any
  getState: () => any
}): AssistantConversationController =>
  createAssistantConversationController({
    getStore: getConversationStore,
    panel: assistantPanelStore,
    registry: assistantTurnRegistry,
    runTurn: runAssistantTurn,
    loadAccess: loadPolicyContext,
    clearUserData: async ({ conversationStore, userUuid }) => {
      // the open conversations of every area and the suggestions pointing to them go too
      await clearUserConversations({
        conversationStore,
        openConversations: browserOpenConversations,
        suggestions: suggestionStore,
        userUuid,
      })
      categoryItemRefsRegistry.clearAll()
    },
    suggestions: {
      withScope: withSuggestionScope,
      reportSettle: reportSuggestionSettle,
      holdTurnLock: holdSuggestionTurnLock,
      onConversationSettled: (params) => suggestionStore.onConversationSettled(params),
    },
    cards: createCardAppliers(reduxStore),
  })
