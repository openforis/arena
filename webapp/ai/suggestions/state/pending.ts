/**
 * The pending suggestions of a bucket: read, replace, add (event detectors) and remove.
 */
import type { AssistantSuggestion, SuggestionTarget } from '../types'
import { own, setEntry } from './records'
import { toBucket, type SuggestionUserState } from './types'

/**
 * Returns the pending suggestions of a bucket.
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @returns {AssistantSuggestion[]} The suggestions (raw: dismissed and in-progress targets included).
 */
export const getPendingOf = (state: SuggestionUserState, bucket: string): AssistantSuggestion[] =>
  own(state.pending, bucket) ?? []

/**
 * Returns the state with the pending suggestions of a bucket replaced (an empty list removes the bucket).
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {AssistantSuggestion[]} suggestions - Suggestions.
 * @returns {SuggestionUserState} The new state.
 */
export const setPending = (
  state: SuggestionUserState,
  bucket: string,
  suggestions: AssistantSuggestion[]
): SuggestionUserState => ({
  ...state,
  pending: setEntry(state.pending, bucket, suggestions.length > 0 ? suggestions : null),
})

/**
 * Returns the pending suggestion with an id.
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @returns {AssistantSuggestion|undefined} The suggestion.
 */
export const findPending = (state: SuggestionUserState, bucket: string, id: string): AssistantSuggestion | undefined =>
  getPendingOf(state, bucket).find((item) => item.id === id)

/**
 * Returns the state with one pending suggestion replaced in place (null or no target removes it).
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @param {AssistantSuggestion|null} next - Replacement.
 * @returns {SuggestionUserState} The new state.
 */
export const replacePending = (
  state: SuggestionUserState,
  bucket: string,
  id: string,
  next: AssistantSuggestion | null
): SuggestionUserState => {
  const kept = next && next.targets.length > 0 ? next : null
  const items = getPendingOf(state, bucket).flatMap((item) => {
    if (item.id !== id) return [item]
    return kept ? [kept] : []
  })
  return setPending(state, bucket, items)
}

/**
 * Unites two target lists by key; a target of the second list replaces the first one's (its count is newer).
 * @param {SuggestionTarget[]} current - Current targets.
 * @param {SuggestionTarget[]} added - Added targets.
 * @returns {SuggestionTarget[]} The united targets, in first-seen order.
 */
export const mergeTargets = (current: SuggestionTarget[], added: SuggestionTarget[]): SuggestionTarget[] => {
  const byKey = new Map<string, SuggestionTarget>()
  for (const target of [...current, ...added]) byKey.set(target.key, target)
  return [...byKey.values()]
}

/**
 * Adds a suggestion (event detectors); one with the same id keeps its fields and unites the targets.
 * @param {SuggestionUserState} state - State.
 * @param {AssistantSuggestion} suggestion - Suggestion.
 * @returns {SuggestionUserState} The new state (the same object when there is no target).
 */
export const withAdded = (state: SuggestionUserState, suggestion: AssistantSuggestion): SuggestionUserState => {
  if (suggestion.targets.length === 0) return state
  const bucket = toBucket(suggestion.surveyId)
  const existing = findPending(state, bucket, suggestion.id)
  if (!existing) return setPending(state, bucket, [...getPendingOf(state, bucket), suggestion])
  return replacePending(state, bucket, suggestion.id, {
    ...existing,
    targets: mergeTargets(existing.targets, suggestion.targets),
  })
}

/**
 * Removes a pending suggestion; its in-progress and dismissed entries stay.
 * @param {SuggestionUserState} state - State.
 * @param {object} params - Parameters.
 * @param {string} params.bucket - Bucket.
 * @param {string} params.id - Suggestion id.
 * @returns {SuggestionUserState} The new state.
 */
export const withoutSuggestion = (
  state: SuggestionUserState,
  { bucket, id }: { bucket: string; id: string }
): SuggestionUserState => replacePending(state, bucket, id, null)
