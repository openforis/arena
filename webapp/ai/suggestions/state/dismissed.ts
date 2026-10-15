/**
 * Dismissal: the targets the user hid, recorded with their count so a counted gap can come back when it grows.
 */
import type { AssistantSuggestion, SuggestionTarget } from '../types'
import { findPending, replacePending } from './pending'
import { getNested, setNested } from './records'
import { toBucket, type DismissedEntry, type DismissedTargets, type SuggestionUserState } from './types'
import { getVisibleTargets } from './visibility'

/**
 * Returns the state with the dismissed entry of a suggestion replaced (null or no target removes it).
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @param {DismissedEntry|null} entry - Entry.
 * @returns {SuggestionUserState} The new state.
 */
export const setDismissed = (
  state: SuggestionUserState,
  bucket: string,
  id: string,
  entry: DismissedEntry | null
): SuggestionUserState => ({
  ...state,
  dismissed: setNested(state.dismissed, bucket, id, entry && Object.keys(entry.targets).length > 0 ? entry : null),
})

/**
 * Records targets of a pending suggestion as dismissed (their count, or true) and removes them from pending.
 * @param {SuggestionUserState} state - State.
 * @param {AssistantSuggestion} suggestion - The pending suggestion.
 * @param {SuggestionTarget[]} targets - Targets to dismiss.
 * @returns {SuggestionUserState} The new state.
 */
export const dismissTargets = (
  state: SuggestionUserState,
  suggestion: AssistantSuggestion,
  targets: SuggestionTarget[]
): SuggestionUserState => {
  const bucket = toBucket(suggestion.surveyId)
  const keys = new Set(targets.map((target) => target.key))
  const recorded = Object.entries(getNested(state.dismissed, bucket, suggestion.id)?.targets ?? {})
  const dismissed: DismissedTargets = Object.fromEntries([
    ...recorded.filter(([key]) => !keys.has(key)),
    ...targets.map((target): [string, number | true] => [target.key, target.count ?? true]),
  ])
  const next = setDismissed(state, bucket, suggestion.id, { kind: suggestion.kind, targets: dismissed })
  return replacePending(next, bucket, suggestion.id, {
    ...suggestion,
    targets: suggestion.targets.filter((target) => !keys.has(target.key)),
  })
}

/**
 * Dismisses the visible targets of a suggestion (the others stay pending).
 * @param {SuggestionUserState} state - State.
 * @param {object} params - Parameters.
 * @param {string} params.bucket - Bucket.
 * @param {string} params.id - Suggestion id.
 * @returns {SuggestionUserState} The new state.
 */
export const withDismissed = (
  state: SuggestionUserState,
  { bucket, id }: { bucket: string; id: string }
): SuggestionUserState => {
  const pending = findPending(state, bucket, id)
  if (!pending) return state
  const visible = getVisibleTargets(state, pending)
  return visible.length > 0 ? dismissTargets(state, pending, visible) : state
}
