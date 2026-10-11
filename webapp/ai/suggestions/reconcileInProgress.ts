/**
 * In-progress targets left by a reload or a closed tab during a Do it turn: settled from the stored conversation.
 */
import type { Conversation } from '@webapp/ai/conversations/types'

import { getSuggestionSettleOutcome } from './suggestionConversation'
import type { SuggestionStore } from './suggestionStore'

/**
 * Loads a conversation; a store error counts as missing.
 * @param {Function} load - Loader.
 * @param {string} id - Conversation id.
 * @returns {Promise<Conversation|null>} The conversation.
 */
const loadSafely = async (
  load: (id: string) => Promise<Conversation | null>,
  id: string
): Promise<Conversation | null> => {
  try {
    return await load(id)
  } catch {
    return null
  }
}

/**
 * Settles the in-progress entries whose conversation ended without this tab seeing it.
 * @param {object} params - Parameters.
 * @param {SuggestionStore} params.store - Suggestion store.
 * @param {string} params.userUuid - User.
 * @param {Function} params.load - Reads a stored conversation (null when missing).
 * @returns {Promise<void>} Resolves when done.
 */
export const reconcileInProgress = async ({
  store,
  userUuid,
  load,
}: {
  store: SuggestionStore
  userUuid: string
  load: (id: string) => Promise<Conversation | null>
}): Promise<void> => {
  for (const conversationId of store.getInProgressConversationIds(userUuid)) {
    const conversation = await loadSafely(load, conversationId)
    // a deleted or unscoped conversation can never settle: its targets show again
    const outcome = conversation?.suggestionScope
      ? getSuggestionSettleOutcome(conversation, { running: false })
      : 'failed'
    if (outcome) store.onConversationSettled({ userUuid, conversationId, outcome })
  }
}
