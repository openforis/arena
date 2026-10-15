/**
 * Conversations started by Do it: they keep the suggestion scope, and report when their targets are done with
 * (settled: no card pending, at least one card) or come back (failed: the conversation produced no card).
 */
import { isChangeSetPending } from '@webapp/ai/conversations/pendingChangeSets'
import type { AssistantMessage, Conversation } from '@webapp/ai/conversations/types'

import { SUGGESTION_DEFINITIONS } from './registry'
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
  if (cards.length > 0) return 'settled'
  // kinds without a card (explanations) are answered in the chat: a completed answer is their success
  const settlesWithoutCard = SUGGESTION_DEFINITIONS[conversation.suggestionScope.kind]?.settlesWithoutCard
  return settlesWithoutCard && answer.status === 'done' ? 'settled' : 'failed'
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

/**
 * Returns the name of the Web Lock held by the tab running a turn of a Do it conversation.
 * @param {string} conversationId - Conversation id.
 * @returns {string} The lock name.
 */
export const getSuggestionTurnLockName = (conversationId: string): string => `arena.ai.suggestionTurn.${conversationId}`

const noop = (): void => undefined

/**
 * Returns the Web Locks manager, or null when the API is missing.
 * @returns {LockManager|null} The manager.
 */
const getLockManager = (): LockManager | null => (typeof navigator !== 'undefined' && navigator.locks) || null

/**
 * Holds the suggestion turn lock of a conversation until its turn ends (other tabs then know it is running). The
 * turn itself is not wrapped: it starts as it always did. No-op without Web Locks; a lock error is swallowed.
 * @param {object} params - Parameters.
 * @param {string} params.conversationId - Conversation of the turn.
 * @param {Promise<unknown>} params.done - The turn; settles when it ends.
 * @param {LockManager|null} [params.locks] - Web Locks manager (the browser's by default).
 * @returns {void}
 */
export const holdSuggestionTurnLock = ({
  conversationId,
  done,
  locks = getLockManager(),
}: {
  conversationId: string
  done: Promise<unknown>
  locks?: Pick<LockManager, 'request'> | null
}): void => {
  if (!locks) return
  try {
    locks.request(getSuggestionTurnLockName(conversationId), () => done.then(noop, noop)).catch(noop)
  } catch {
    // no lock: other tabs may settle this turn's entry early
  }
}

/**
 * Returns the names of the Web Locks held now (empty without the API).
 * @returns {Promise<string[]>} The names.
 */
export const getHeldLockNames = async (): Promise<string[]> => {
  const locks = getLockManager()
  if (!locks) return []
  try {
    const { held } = await locks.query()
    return (held ?? []).map((lock) => lock.name ?? '')
  } catch {
    return []
  }
}
