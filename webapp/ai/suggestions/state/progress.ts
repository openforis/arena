/**
 * Do it: the targets sent to a conversation are in progress until its cards settle.
 */
import type { SettleOutcome } from '../types'
import { dismissTargets } from './dismissed'
import { findPending, mergeTargets } from './pending'
import { getNested, setNested } from './records'
import type { InProgressEntry, SuggestionUserState } from './types'
import { getVisibleTargets } from './visibility'

/**
 * Returns the state with the in-progress entry of a suggestion replaced (null or no target removes it).
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @param {InProgressEntry|null} entry - Entry.
 * @returns {SuggestionUserState} The new state.
 */
export const setInProgress = (
  state: SuggestionUserState,
  bucket: string,
  id: string,
  entry: InProgressEntry | null
): SuggestionUserState => ({
  ...state,
  inProgress: setNested(state.inProgress, bucket, id, entry && entry.targets.length > 0 ? entry : null),
})

/**
 * Marks the visible targets of a suggestion in progress for a conversation (Do it); pending is unchanged.
 * @param {SuggestionUserState} state - State.
 * @param {object} params - Parameters.
 * @param {string} params.bucket - Bucket.
 * @param {string} params.id - Suggestion id.
 * @param {string} params.conversationId - Accepting conversation.
 * @param {string[]} [params.targetKeys] - Only the visible targets with these keys (the ones sent); all when omitted.
 * @returns {SuggestionUserState} The new state (the same object when no target is visible).
 */
export const withProgress = (
  state: SuggestionUserState,
  {
    bucket,
    id,
    conversationId,
    targetKeys,
  }: { bucket: string; id: string; conversationId: string; targetKeys?: string[] }
): SuggestionUserState => {
  const pending = findPending(state, bucket, id)
  const visibleAll = pending ? getVisibleTargets(state, pending) : []
  const visible = targetKeys ? visibleAll.filter((target) => targetKeys.includes(target.key)) : visibleAll
  if (!pending || visible.length === 0) return state
  const current = getNested(state.inProgress, bucket, id)?.targets ?? []
  return setInProgress(state, bucket, id, {
    kind: pending.kind,
    conversationId,
    targets: mergeTargets(current, visible),
  })
}

/**
 * Ends the in-progress entries of a conversation: settled dismisses their targets still in the gap (with the current
 * count), failed shows them again.
 * @param {SuggestionUserState} state - State.
 * @param {object} params - Parameters.
 * @param {string} params.conversationId - Conversation.
 * @param {SettleOutcome} params.outcome - Outcome.
 * @returns {SuggestionUserState} The new state.
 */
export const withSettled = (
  state: SuggestionUserState,
  { conversationId, outcome }: { conversationId: string; outcome: SettleOutcome }
): SuggestionUserState => {
  let next = state
  for (const [bucket, ids] of Object.entries(state.inProgress)) {
    for (const [id, entry] of Object.entries(ids)) {
      if (entry.conversationId !== conversationId) continue
      next = setInProgress(next, bucket, id, null)
      const pending = findPending(next, bucket, id)
      if (outcome === 'settled' && pending) {
        const keys = new Set(entry.targets.map((target) => target.key))
        next = dismissTargets(
          next,
          pending,
          pending.targets.filter((target) => keys.has(target.key))
        )
      }
    }
  }
  return next
}

/**
 * Returns the conversations that have targets in progress.
 * @param {SuggestionUserState} state - State.
 * @returns {string[]} The unique conversation ids.
 */
export const getInProgressConversationIds = (state: SuggestionUserState): string[] => {
  const ids = new Set<string>()
  for (const entries of Object.values(state.inProgress)) {
    for (const entry of Object.values(entries)) ids.add(entry.conversationId)
  }
  return [...ids]
}

/**
 * Returns the bucket that has targets in progress for a conversation.
 * @param {SuggestionUserState} state - State.
 * @param {string} conversationId - Conversation.
 * @returns {string|null} The bucket; null when the conversation has nothing in progress.
 */
export const getBucketOfConversation = (state: SuggestionUserState, conversationId: string): string | null => {
  for (const [bucket, entries] of Object.entries(state.inProgress)) {
    if (Object.values(entries).some((entry) => entry.conversationId === conversationId)) return bucket
  }
  return null
}
