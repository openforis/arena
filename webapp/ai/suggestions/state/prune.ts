/**
 * What leaves the state because it no longer occurs: a kind that was detected again (state detectors), targets a
 * resolver found fixed, a deleted survey. A dismissal outlives its pending suggestion, so everything goes by the stored
 * kind and by id, never by what is pending.
 */
import type { AssistantSuggestion, SuggestionKind } from '../types'
import { setDismissed } from './dismissed'
import { getPendingOf, findPending, replacePending, setPending } from './pending'
import { setInProgress } from './progress'
import { getNested, own, setEntry } from './records'
import type { DismissedTargets, SuggestionUserState, TrackedSuggestion } from './types'

/**
 * Returns the dismissed targets restricted to the gap.
 * @param {DismissedTargets} targets - Dismissed targets.
 * @param {Set<string>} gap - Target keys still in the gap.
 * @returns {DismissedTargets} The kept targets.
 */
const keepDismissedIn = (targets: DismissedTargets, gap: Set<string>): DismissedTargets =>
  Object.fromEntries(Object.entries(targets).filter(([key]) => gap.has(key)))

/**
 * Prunes the dismissed and in-progress entries of a kind in a bucket to the targets still in the gap.
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {SuggestionKind} kind - Kind.
 * @param {AssistantSuggestion[]} suggestions - The kind's new suggestions (the gap).
 * @returns {SuggestionUserState} The pruned state.
 */
const pruneKind = (
  state: SuggestionUserState,
  bucket: string,
  kind: SuggestionKind,
  suggestions: AssistantSuggestion[]
): SuggestionUserState => {
  const gapOf = (id: string) =>
    new Set(suggestions.find((item) => item.id === id)?.targets.map((target) => target.key) ?? [])
  let next = state
  for (const [id, entry] of Object.entries(own(state.dismissed, bucket) ?? {})) {
    if (entry.kind === kind)
      next = setDismissed(next, bucket, id, { ...entry, targets: keepDismissedIn(entry.targets, gapOf(id)) })
  }
  for (const [id, entry] of Object.entries(own(state.inProgress, bucket) ?? {})) {
    if (entry.kind !== kind) continue
    const gap = gapOf(id)
    next = setInProgress(next, bucket, id, { ...entry, targets: entry.targets.filter((target) => gap.has(target.key)) })
  }
  return next
}

/**
 * Replaces every pending suggestion of a kind in a bucket (state detectors); an empty list resolves the kind.
 * @param {SuggestionUserState} state - State.
 * @param {object} params - Parameters.
 * @param {string} params.bucket - Bucket.
 * @param {SuggestionKind} params.kind - Kind.
 * @param {AssistantSuggestion[]} params.suggestions - The kind's suggestions now.
 * @returns {SuggestionUserState} The new state.
 */
export const withKind = (
  state: SuggestionUserState,
  { bucket, kind, suggestions }: { bucket: string; kind: SuggestionKind; suggestions: AssistantSuggestion[] }
): SuggestionUserState => {
  const valid = suggestions.filter((item) => item.kind === kind && item.targets.length > 0)
  const others = getPendingOf(state, bucket).filter((item) => item.kind !== kind)
  return pruneKind(setPending(state, bucket, [...others, ...valid]), bucket, kind, valid)
}

/**
 * Removes targets that are no longer in the gap (resolvers): from pending, in progress and dismissed.
 * @param {SuggestionUserState} state - State.
 * @param {object} params - Parameters.
 * @param {string} params.bucket - Bucket.
 * @param {string} params.id - Suggestion id.
 * @param {string[]} params.targetKeys - Resolved target keys.
 * @returns {SuggestionUserState} The new state.
 */
export const withoutTargets = (
  state: SuggestionUserState,
  { bucket, id, targetKeys }: { bucket: string; id: string; targetKeys: string[] }
): SuggestionUserState => {
  const removed = new Set(targetKeys)
  const keep = (target: { key: string }) => !removed.has(target.key)
  let next = state
  const pending = findPending(next, bucket, id)
  if (pending) next = replacePending(next, bucket, id, { ...pending, targets: pending.targets.filter(keep) })
  const progress = getNested(next.inProgress, bucket, id)
  if (progress) next = setInProgress(next, bucket, id, { ...progress, targets: progress.targets.filter(keep) })
  const dismissed = getNested(next.dismissed, bucket, id)
  if (dismissed) {
    const targets = Object.fromEntries(Object.entries(dismissed.targets).filter(([key]) => !removed.has(key)))
    next = setDismissed(next, bucket, id, { ...dismissed, targets })
  }
  return next
}

/**
 * Lists the suggestions the state holds something of in a bucket (pending, dismissed or in progress), so a resolver
 * also reaches the dismissed targets of a suggestion that is no longer pending.
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @returns {TrackedSuggestion[]} The suggestions, with the keys of all their targets.
 */
export const getTrackedOf = (state: SuggestionUserState, bucket: string): TrackedSuggestion[] => {
  const byId = new Map<string, { kind: SuggestionKind; keys: Set<string> }>()
  const track = (id: string, kind: SuggestionKind, keys: string[]): void => {
    const entry = byId.get(id) ?? { kind, keys: new Set<string>() }
    for (const key of keys) entry.keys.add(key)
    byId.set(id, entry)
  }
  for (const item of getPendingOf(state, bucket)) {
    track(
      item.id,
      item.kind,
      item.targets.map((target) => target.key)
    )
  }
  for (const [id, entry] of Object.entries(own(state.dismissed, bucket) ?? {})) {
    track(id, entry.kind, Object.keys(entry.targets))
  }
  for (const [id, entry] of Object.entries(own(state.inProgress, bucket) ?? {})) {
    track(
      id,
      entry.kind,
      entry.targets.map((target) => target.key)
    )
  }
  return [...byId].map(([id, { kind, keys }]) => ({ id, kind, targetKeys: [...keys] }))
}

/**
 * Removes everything stored for a bucket (a deleted survey): pending, dismissed and in-progress entries.
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @returns {SuggestionUserState} The new state.
 */
export const withoutBucket = (state: SuggestionUserState, bucket: string): SuggestionUserState => ({
  ...state,
  pending: setEntry(state.pending, bucket, null),
  dismissed: setEntry(state.dismissed, bucket, null),
  inProgress: setEntry(state.inProgress, bucket, null),
})
