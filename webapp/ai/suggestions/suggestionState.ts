/**
 * Suggestions of one user as stored under `arena.ai.suggestions.<userUuid>`, and the rules of the spec (§3.2) as pure
 * functions: dismissal by target, growth steps, in progress, visibility. The store wraps them with localStorage.
 */
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

import {
  SUGGESTION_GROWTH_STEPS,
  type AssistantSuggestion,
  type SettleOutcome,
  type SuggestionKind,
  type SuggestionTarget,
} from './types'

// target key → the count when dismissed (counted kinds) or true
export type DismissedTargets = Record<string, number | true>

export type InProgressEntry = { conversationId: string; targets: SuggestionTarget[] }

export type SuggestionUserState = {
  // bucket ("<surveyId>" or "help") → suggestions
  pending: Record<string, AssistantSuggestion[]>
  // bucket → suggestion id → dismissed targets
  dismissed: Record<string, Record<string, DismissedTargets>>
  // bucket → suggestion id → targets accepted with Do it, and the conversation working on them
  inProgress: Record<string, Record<string, InProgressEntry>>
  seenModules: string[]
}

export type VisibilityParams = {
  surveyId: number | null
  cycle: string | null
  availableAreas: AssistantArea[]
  enabled: boolean
  now: Date
}

export const HELP_BUCKET = 'help'

/**
 * Returns the bucket of a survey.
 * @param {number|null} surveyId - Survey id (null: Help).
 * @returns {string} The bucket key.
 */
export const toBucket = (surveyId: number | null): string => (surveyId === null ? HELP_BUCKET : String(surveyId))

/**
 * Returns an empty state.
 * @returns {SuggestionUserState} The state.
 */
export const emptySuggestionState = (): SuggestionUserState => ({
  pending: {},
  dismissed: {},
  inProgress: {},
  seenModules: [],
})

/**
 * Returns true for a non-array object.
 * @param {unknown} value - Value.
 * @returns {boolean} True for a plain object.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Returns the own value of a key (inherited keys such as "constructor" are not values).
 * @param {Record<string, T>} record - Record.
 * @param {string} key - Key.
 * @returns {T|undefined} The value.
 */
const own = <T>(record: Record<string, T>, key: string): T | undefined =>
  Object.hasOwn(record, key) ? record[key] : undefined

/**
 * Returns true for a valid target.
 * @param {unknown} value - Value.
 * @returns {boolean} True when valid.
 */
const isTarget = (value: unknown): value is SuggestionTarget =>
  isPlainObject(value) &&
  typeof value.key === 'string' &&
  (value.count === undefined || typeof value.count === 'number')

/**
 * Returns true for a valid suggestion.
 * @param {unknown} value - Value.
 * @returns {boolean} True when valid.
 */
const isSuggestion = (value: unknown): value is AssistantSuggestion =>
  isPlainObject(value) &&
  typeof value.id === 'string' &&
  typeof value.kind === 'string' &&
  typeof value.area === 'string' &&
  (value.surveyId === null || typeof value.surveyId === 'number') &&
  (value.cycle === null || typeof value.cycle === 'string') &&
  Array.isArray(value.targets) &&
  value.targets.length > 0 &&
  value.targets.every(isTarget) &&
  typeof value.createdAt === 'string' &&
  (value.expiresAt === null || typeof value.expiresAt === 'string')

/**
 * Parses a record, keeping the entries the parser accepts (Object.fromEntries: "__proto__" stays an own key).
 * @param {unknown} value - Raw value.
 * @param {Function} parseEntry - Returns the parsed entry, or null to drop it.
 * @returns {Record<string, T>|null} The record, or null when nothing is left.
 */
const parseRecord = <T>(value: unknown, parseEntry: (entry: unknown) => T | null): Record<string, T> | null => {
  if (!isPlainObject(value)) return null
  const entries: [string, T][] = []
  for (const [key, entry] of Object.entries(value)) {
    const parsed = parseEntry(entry)
    if (parsed !== null) entries.push([key, parsed])
  }
  return entries.length > 0 ? Object.fromEntries(entries) : null
}

/**
 * Parses the suggestions of a bucket.
 * @param {unknown} value - Raw value.
 * @returns {AssistantSuggestion[]|null} The valid suggestions, or null when none.
 */
const parsePendingBucket = (value: unknown): AssistantSuggestion[] | null => {
  if (!Array.isArray(value)) return null
  const valid = value.filter(isSuggestion)
  return valid.length > 0 ? valid : null
}

/**
 * Parses a dismissed target value.
 * @param {unknown} value - Raw value.
 * @returns {number|true|null} The count or true, or null when invalid.
 */
const parseDismissedValue = (value: unknown): number | true | null =>
  value === true || typeof value === 'number' ? value : null

/**
 * Parses the in-progress entry of a suggestion.
 * @param {unknown} value - Raw value.
 * @returns {InProgressEntry|null} The entry, or null when invalid.
 */
const parseInProgressEntry = (value: unknown): InProgressEntry | null => {
  if (!isPlainObject(value) || typeof value.conversationId !== 'string' || !Array.isArray(value.targets)) return null
  const targets = value.targets.filter(isTarget)
  return targets.length > 0 ? { conversationId: value.conversationId, targets } : null
}

/**
 * Parses a stored value; anything unexpected is dropped, a corrupt value is an empty state.
 * @param {string|null} raw - Stored JSON.
 * @returns {SuggestionUserState} The state.
 */
export const parseSuggestionState = (raw: string | null): SuggestionUserState => {
  if (!raw) return emptySuggestionState()
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return emptySuggestionState()
  }
  if (!isPlainObject(parsed)) return emptySuggestionState()
  const { pending, dismissed, inProgress, seenModules } = parsed
  return {
    pending: parseRecord(pending, parsePendingBucket) ?? {},
    dismissed:
      parseRecord(dismissed, (bucket) => parseRecord(bucket, (ids) => parseRecord(ids, parseDismissedValue))) ?? {},
    inProgress: parseRecord(inProgress, (bucket) => parseRecord(bucket, parseInProgressEntry)) ?? {},
    seenModules: Array.isArray(seenModules)
      ? [...new Set(seenModules.filter((item): item is string => typeof item === 'string'))]
      : [],
  }
}

/**
 * Returns a record with one entry set (moved last) or, with null, removed.
 * @param {Record<string, T>} record - Record.
 * @param {string} key - Key.
 * @param {T|null} value - Value, or null to remove.
 * @returns {Record<string, T>} The new record.
 */
const setEntry = <T>(record: Record<string, T>, key: string, value: T | null): Record<string, T> => {
  const rest = Object.entries(record).filter(([entryKey]) => entryKey !== key)
  return Object.fromEntries(value === null ? rest : [...rest, [key, value]])
}

/**
 * Sets (or removes, with null) the entry of a suggestion id in a bucket; an emptied bucket is removed.
 * @param {Record<string, Record<string, T>>} record - Record by bucket and id.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @param {T|null} value - Value, or null to remove.
 * @returns {Record<string, Record<string, T>>} The new record.
 */
const setNested = <T>(
  record: Record<string, Record<string, T>>,
  bucket: string,
  id: string,
  value: T | null
): Record<string, Record<string, T>> => {
  const ids = setEntry(own(record, bucket) ?? {}, id, value)
  return setEntry(record, bucket, Object.keys(ids).length > 0 ? ids : null)
}

/**
 * Returns the entry of a suggestion id in a bucket.
 * @param {Record<string, Record<string, T>>} record - Record by bucket and id.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @returns {T|undefined} The entry.
 */
const getNested = <T>(record: Record<string, Record<string, T>>, bucket: string, id: string): T | undefined => {
  const ids = own(record, bucket)
  return ids ? own(ids, id) : undefined
}

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
const setPending = (state: SuggestionUserState, bucket: string, suggestions: AssistantSuggestion[]) => ({
  ...state,
  pending: setEntry(state.pending, bucket, suggestions.length > 0 ? suggestions : null),
})

/**
 * Returns the state with the dismissed targets of a suggestion replaced (empty removes them).
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @param {DismissedTargets} targets - Dismissed targets.
 * @returns {SuggestionUserState} The new state.
 */
const setDismissed = (state: SuggestionUserState, bucket: string, id: string, targets: DismissedTargets) => ({
  ...state,
  dismissed: setNested(state.dismissed, bucket, id, Object.keys(targets).length > 0 ? targets : null),
})

/**
 * Returns the state with the in-progress entry of a suggestion replaced (null or no target removes it).
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @param {InProgressEntry|null} entry - Entry.
 * @returns {SuggestionUserState} The new state.
 */
const setInProgress = (state: SuggestionUserState, bucket: string, id: string, entry: InProgressEntry | null) => ({
  ...state,
  inProgress: setNested(state.inProgress, bucket, id, entry && entry.targets.length > 0 ? entry : null),
})

/**
 * Returns the pending suggestion with an id.
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @returns {AssistantSuggestion|undefined} The suggestion.
 */
const findPending = (state: SuggestionUserState, bucket: string, id: string): AssistantSuggestion | undefined =>
  getPendingOf(state, bucket).find((item) => item.id === id)

/**
 * Returns the state with one pending suggestion replaced in place (null or no target removes it).
 * @param {SuggestionUserState} state - State.
 * @param {string} bucket - Bucket.
 * @param {string} id - Suggestion id.
 * @param {AssistantSuggestion|null} next - Replacement.
 * @returns {SuggestionUserState} The new state.
 */
const replacePending = (
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
 * Returns true when a dismissed counted target grew by at least its kind's step.
 * @param {SuggestionKind} kind - Kind.
 * @param {SuggestionTarget} target - Current target.
 * @param {number|true} seen - Value recorded at the dismissal.
 * @returns {boolean} True when it shows again.
 */
const hasGrown = (kind: SuggestionKind, target: SuggestionTarget, seen: number | true): boolean => {
  const step = SUGGESTION_GROWTH_STEPS[kind]
  return typeof seen === 'number' && step !== undefined && target.count !== undefined && target.count >= seen + step
}

/**
 * Returns the visible targets of a suggestion: not in progress, and not dismissed (or a counted gap that grew).
 * @param {SuggestionUserState} state - State.
 * @param {AssistantSuggestion} suggestion - Suggestion.
 * @returns {SuggestionTarget[]} The visible targets.
 */
export const getVisibleTargets = (state: SuggestionUserState, suggestion: AssistantSuggestion): SuggestionTarget[] => {
  const bucket = toBucket(suggestion.surveyId)
  const progress = getNested(state.inProgress, bucket, suggestion.id)
  const progressKeys = new Set((progress?.targets ?? []).map((target) => target.key))
  const dismissed = getNested(state.dismissed, bucket, suggestion.id) ?? {}
  return suggestion.targets.filter((target) => {
    if (progressKeys.has(target.key)) return false
    const seen = own(dismissed, target.key)
    return seen === undefined || hasGrown(suggestion.kind, target, seen)
  })
}

/**
 * Returns true when a suggestion may show now (area, expiry, cycle).
 * @param {AssistantSuggestion} suggestion - Suggestion.
 * @param {VisibilityParams} params - Visibility parameters.
 * @returns {boolean} True when shown.
 */
const isShown = (suggestion: AssistantSuggestion, { cycle, availableAreas, now }: VisibilityParams): boolean =>
  availableAreas.includes(suggestion.area) &&
  (suggestion.expiresAt === null || Date.parse(suggestion.expiresAt) > now.getTime()) &&
  (suggestion.cycle === null || suggestion.cycle === cycle)

/**
 * Returns the visible suggestions of a survey plus Help, each with its visible targets only.
 * @param {SuggestionUserState} state - State.
 * @param {VisibilityParams} params - Visibility parameters.
 * @returns {AssistantSuggestion[]} The visible suggestions.
 */
export const selectVisible = (state: SuggestionUserState, params: VisibilityParams): AssistantSuggestion[] => {
  if (!params.enabled) return []
  const buckets = params.surveyId === null ? [HELP_BUCKET] : [toBucket(params.surveyId), HELP_BUCKET]
  const visible: AssistantSuggestion[] = []
  for (const bucket of buckets) {
    for (const suggestion of getPendingOf(state, bucket)) {
      const targets = isShown(suggestion, params) ? getVisibleTargets(state, suggestion) : []
      if (targets.length > 0) visible.push({ ...suggestion, targets })
    }
  }
  return visible
}

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
  const isOfKind = (id: string) => id.startsWith(`${kind}:`)
  let next = state
  for (const [id, targets] of Object.entries(own(state.dismissed, bucket) ?? {})) {
    if (isOfKind(id)) next = setDismissed(next, bucket, id, keepDismissedIn(targets, gapOf(id)))
  }
  for (const [id, entry] of Object.entries(own(state.inProgress, bucket) ?? {})) {
    if (!isOfKind(id)) continue
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
 * Unites two target lists by key; a target of the second list replaces the first one's (its count is newer).
 * @param {SuggestionTarget[]} current - Current targets.
 * @param {SuggestionTarget[]} added - Added targets.
 * @returns {SuggestionTarget[]} The united targets, in first-seen order.
 */
const mergeTargets = (current: SuggestionTarget[], added: SuggestionTarget[]): SuggestionTarget[] => {
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
  const keep = (target: SuggestionTarget) => !removed.has(target.key)
  let next = state
  const pending = findPending(next, bucket, id)
  if (pending) next = replacePending(next, bucket, id, { ...pending, targets: pending.targets.filter(keep) })
  const entry = getNested(next.inProgress, bucket, id)
  if (entry) next = setInProgress(next, bucket, id, { ...entry, targets: entry.targets.filter(keep) })
  const dismissed = getNested(next.dismissed, bucket, id)
  if (dismissed) {
    next = setDismissed(
      next,
      bucket,
      id,
      Object.fromEntries(Object.entries(dismissed).filter(([key]) => !removed.has(key)))
    )
  }
  return next
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

/**
 * Records targets of a pending suggestion as dismissed (their count, or true) and removes them from pending.
 * @param {SuggestionUserState} state - State.
 * @param {AssistantSuggestion} suggestion - The pending suggestion.
 * @param {SuggestionTarget[]} targets - Targets to dismiss.
 * @returns {SuggestionUserState} The new state.
 */
const dismissTargets = (
  state: SuggestionUserState,
  suggestion: AssistantSuggestion,
  targets: SuggestionTarget[]
): SuggestionUserState => {
  const bucket = toBucket(suggestion.surveyId)
  const keys = new Set(targets.map((target) => target.key))
  const recorded: DismissedTargets = { ...(getNested(state.dismissed, bucket, suggestion.id) ?? {}) }
  const entries = Object.entries(recorded).filter(([key]) => !keys.has(key))
  const dismissed: DismissedTargets = Object.fromEntries([
    ...entries,
    ...targets.map((target): [string, number | true] => [target.key, target.count ?? true]),
  ])
  const next = setDismissed(state, bucket, suggestion.id, dismissed)
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

/**
 * Marks the visible targets of a suggestion in progress for a conversation (Do it); pending is unchanged.
 * @param {SuggestionUserState} state - State.
 * @param {object} params - Parameters.
 * @param {string} params.bucket - Bucket.
 * @param {string} params.id - Suggestion id.
 * @param {string} params.conversationId - Accepting conversation.
 * @returns {SuggestionUserState} The new state (the same object when no target is visible).
 */
export const withProgress = (
  state: SuggestionUserState,
  { bucket, id, conversationId }: { bucket: string; id: string; conversationId: string }
): SuggestionUserState => {
  const pending = findPending(state, bucket, id)
  const visible = pending ? getVisibleTargets(state, pending) : []
  if (visible.length === 0) return state
  const current = getNested(state.inProgress, bucket, id)?.targets ?? []
  return setInProgress(state, bucket, id, { conversationId, targets: mergeTargets(current, visible) })
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
 * Records a module as seen (module introduction).
 * @param {SuggestionUserState} state - State.
 * @param {string} module - Module.
 * @returns {SuggestionUserState} The new state (the same object when already seen).
 */
export const withModuleSeen = (state: SuggestionUserState, module: string): SuggestionUserState =>
  state.seenModules.includes(module) ? state : { ...state, seenModules: [...state.seenModules, module] }

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
