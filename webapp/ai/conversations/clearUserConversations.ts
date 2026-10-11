/**
 * "Clear conversations": every conversation of the user in this browser, whatever the area and the survey.
 */
import type { SuggestionStore } from '@webapp/ai/suggestions/suggestionStore'

import type { ConversationStore } from './conversationStore'
import type { OpenConversations } from './openConversations'

/**
 * Deletes the user's conversations and forgets their open conversations and suggestions.
 * @param {object} params - Parameters.
 * @param {object} params.conversationStore - Conversation store.
 * @param {object} params.openConversations - Remembered open conversations.
 * @param {object} [params.suggestions] - Suggestion store (its in-progress entries point to these conversations).
 * @param {string} params.userUuid - User UUID.
 * @returns {Promise<void>} Resolves when done.
 */
export const clearUserConversations = async ({
  conversationStore,
  openConversations,
  suggestions,
  userUuid,
}: {
  conversationStore: Pick<ConversationStore, 'clearUser'>
  openConversations: Pick<OpenConversations, 'clear'>
  suggestions?: Pick<SuggestionStore, 'clearUser'>
  userUuid: string
}): Promise<void> => {
  // first: an id left behind would point to a deleted conversation (dropped on load anyway)
  openConversations.clear(userUuid)
  suggestions?.clearUser(userUuid)
  await conversationStore.clearUser(userUuid)
}
