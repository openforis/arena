/**
 * Conversations started by Do it: they keep the suggestion scope, and report when their targets are done with
 * (settled: no card pending, at least one card) or come back (failed: the conversation produced no card).
 */
import { isChangeSetPending } from '@webapp/ai/conversations/pendingChangeSets'
import type { AssistantMessage, Conversation } from '@webapp/ai/conversations/types'

import { suggestionStore, type SuggestionStore } from './suggestionStore'
import type { SettleOutcome, SuggestionScope } from './types'

/**
 * Returns the conversation with a suggestion scope.
 * @param {Conversation} conversation - New conversation.
 * @param {SuggestionScope} scope - Scope of the accepted suggestion.
 * @returns {Conversation} The scoped conversation.
 */
export const withSuggestionScope = (conversation: Conversation, scope: SuggestionScope): Conversation => ({
  ...conversation,
  suggestionScope: scope,
})

/**
 * Returns the last answer of a conversation.
 * @param {Conversation} conversation - Conversation.
 * @returns {AssistantMessage|null} The answer.
 */
const getLastAnswer = (conversation: Conversation): AssistantMessage | null => {
  let last: AssistantMessage | null = null
  for (const message of conversation.messages) {
    if (message.role === 'assistant') last = message
  }
  return last
}

/**
 * Returns the outcome of a Do it conversation, or null while it is not known yet.
 * @param {Conversation} conversation - Conversation.
 * @param {object} [options] - Options.
 * @param {boolean} [options.running] - A streaming answer is live (false: a leftover of a reload, counted as stopped).
 * @returns {SettleOutcome|null} The outcome.
 */
export const getSuggestionSettleOutcome = (
  conversation: Conversation,
  { running = true }: { running?: boolean } = {}
): SettleOutcome | null => {
  if (!conversation.suggestionScope) return null
  const answer = getLastAnswer(conversation)
  if (!answer || (running && answer.status === 'streaming')) return null
  const cards = Object.values(conversation.changeSets)
  if (cards.some(isChangeSetPending)) return null
  return cards.length > 0 ? 'settled' : 'failed'
}

/**
 * Reports the outcome of a Do it conversation to the suggestion store, when it is known.
 * @param {object} params - Parameters.
 * @param {Conversation} params.conversation - Conversation (after a turn or a card action).
 * @param {SuggestionStore} [params.store] - Store.
 * @param {boolean} [params.running] - A streaming answer is live.
 * @returns {SettleOutcome|null} The reported outcome.
 */
export const reportSuggestionSettle = ({
  conversation,
  store = suggestionStore,
  running = true,
}: {
  conversation: Conversation
  store?: SuggestionStore
  running?: boolean
}): SettleOutcome | null => {
  const outcome = getSuggestionSettleOutcome(conversation, { running })
  if (outcome)
    store.onConversationSettled({ userUuid: conversation.userUuid, conversationId: conversation.id, outcome })
  return outcome
}
