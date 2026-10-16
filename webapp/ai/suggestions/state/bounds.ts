/**
 * How big the stored state may get: expired suggestions go, and survey buckets and seen modules are capped, so the
 * localStorage entry of a user stays small however long the browser is used. Targets are not capped in normal
 * operation: they mirror the survey and the resolvers prune them, and a cap would hide live targets or bring back
 * dismissed ones. When the storage is full, the store asks for a smaller state (shrink levels), which also caps the
 * targets of the surveys not in use and the dismissals of targets that are gone.
 */
import type { AssistantSuggestion } from '../types'
import {
  HELP_BUCKET,
  emptySuggestionState,
  type DismissedEntry,
  type InProgressEntry,
  type SuggestionUserState,
} from './types'

// surveys with stored suggestions (Help does not count); the survey being written is never dropped, the least
// recently written one goes
export const MAX_SURVEY_BUCKETS = 20
export const MAX_SEEN_MODULES = 50
const TOUCH_PRECISION_MS = 60 * 60 * 1000

type Limits = { buckets: number; targets: number; dismissed: number; modules: number }

const NORMAL_LIMITS: Limits = {
  buckets: MAX_SURVEY_BUCKETS,
  targets: Infinity,
  dismissed: Infinity,
  modules: MAX_SEEN_MODULES,
}

const TIGHT_LIMITS: Limits = { buckets: 5, targets: 50, dismissed: 50, modules: 20 }

// the shrink levels the storage wrapper may ask for
const LAST_SHRINK_LEVEL = 3

/**
 * Applies a change to every entry of a record; returns the same record when nothing changed.
 * @param {Record<string, T>} record - Record.
 * @param {Function} change - Returns the new value of an entry, the same value when unchanged, or null to drop it.
 * @returns {Record<string, T>} The record.
 */
const mapEntries = <T>(record: Record<string, T>, change: (value: T, key: string) => T | null): Record<string, T> => {
  let changed = false
  const entries: [string, T][] = []
  for (const [key, value] of Object.entries(record)) {
    const next = change(value, key)
    if (next !== value) changed = true
    if (next !== null) entries.push([key, next])
  }
  return changed ? Object.fromEntries(entries) : record
}

/**
 * Keeps the `max` most recently written survey buckets of a record, except that the Help bucket and the bucket in use
 * are never dropped. A bucket without a time (stored by an older version) counts as the oldest; among equals the
 * lowest survey id goes first.
 * @param {Record<string, T>} record - Record by bucket.
 * @param {number} max - Survey buckets to keep.
 * @param {string|null} keepBucket - A bucket that is never dropped.
 * @param {Record<string, number>|undefined} touchedAt - When each bucket was last written.
 * @returns {Record<string, T>} The record.
 */
const capBuckets = <T>(
  record: Record<string, T>,
  max: number,
  keepBucket: string | null,
  touchedAt: Record<string, number> | undefined
): Record<string, T> => {
  const surveyBuckets = Object.keys(record).filter((bucket) => bucket !== HELP_BUCKET)
  const excess = surveyBuckets.length - max
  if (excess <= 0) return record
  const timeOf = (bucket: string): number => touchedAt?.[bucket] ?? 0
  const oldestFirst = surveyBuckets.filter((bucket) => bucket !== keepBucket).sort((a, b) => timeOf(a) - timeOf(b))
  const dropped = new Set(oldestFirst.slice(0, excess))
  return Object.fromEntries(Object.entries(record).filter(([bucket]) => !dropped.has(bucket)))
}

/**
 * Keeps the first targets of a suggestion or an in-progress entry (only when the storage is full).
 * @param {object} entry - Suggestion or in-progress entry.
 * @param {number} max - Targets to keep.
 * @returns {object} The entry (the same one when within the cap).
 */
const capTargets = <T extends { targets: { key: string }[] }>(entry: T, max: number): T =>
  entry.targets.length <= max ? entry : { ...entry, targets: entry.targets.slice(0, max) }

/**
 * Keeps the latest dismissed targets that are no longer pending (they are recorded in order). A dismissed target that
 * is still pending is never cut: it would show again.
 * @param {DismissedEntry} entry - Entry.
 * @param {number} max - Targets to keep, besides those still pending.
 * @param {Set<string>} stillPending - Keys of the targets the suggestion still has.
 * @returns {DismissedEntry} The entry (the same one when within the cap).
 */
const capDismissed = (entry: DismissedEntry, max: number, stillPending: Set<string>): DismissedEntry => {
  const gone = Object.keys(entry.targets).filter((key) => !stillPending.has(key))
  if (gone.length <= max) return entry
  const cut = new Set(gone.slice(0, gone.length - max))
  return { ...entry, targets: Object.fromEntries(Object.entries(entry.targets).filter(([key]) => !cut.has(key))) }
}

/**
 * Returns the keys of the targets a bucket has pending for a suggestion id.
 * @param {AssistantSuggestion[]|undefined} suggestions - Pending suggestions of the bucket.
 * @param {string} id - Suggestion id.
 * @returns {Set<string>} The keys.
 */
const pendingKeysOf = (suggestions: AssistantSuggestion[] | undefined, id: string): Set<string> =>
  new Set(suggestions?.find((item) => item.id === id)?.targets.map((target) => target.key))

/**
 * Removes the pending suggestions that expired (a re-detected one then starts afresh, with a new expiry).
 * @param {AssistantSuggestion[]} suggestions - Suggestions of a bucket.
 * @param {Date} now - Now.
 * @returns {AssistantSuggestion[]|null} The same list when none expired, the rest, or null when none is left.
 */
const withoutExpired = (suggestions: AssistantSuggestion[], now: Date): AssistantSuggestion[] | null => {
  const alive = suggestions.filter((item) => item.expiresAt === null || Date.parse(item.expiresAt) > now.getTime())
  if (alive.length === suggestions.length) return suggestions
  return alive.length > 0 ? alive : null
}

/**
 * Caps the targets of the suggestions of a bucket.
 * @param {AssistantSuggestion[]} suggestions - Suggestions.
 * @param {number} max - Targets per suggestion.
 * @returns {AssistantSuggestion[]} The suggestions (the same list when within the cap).
 */
const capPendingTargets = (suggestions: AssistantSuggestion[], max: number): AssistantSuggestion[] => {
  const capped = suggestions.map((item) => capTargets(item, max))
  return capped.some((item, index) => item !== suggestions[index]) ? capped : suggestions
}

/**
 * Drops the times of the buckets the state no longer holds.
 * @param {Record<string, number>|undefined} touchedAt - Times by bucket.
 * @param {Record<string, unknown>[]} records - The records by bucket the state holds.
 * @returns {Record<string, number>|undefined} The times (the same record when all are kept; undefined when none is).
 */
const pruneTouchedAt = (
  touchedAt: Record<string, number> | undefined,
  records: Record<string, unknown>[]
): Record<string, number> | undefined => {
  if (!touchedAt) return touchedAt
  const kept = Object.entries(touchedAt).filter(([bucket]) => records.some((record) => bucket in record))
  if (kept.length === Object.keys(touchedAt).length) return touchedAt
  return kept.length > 0 ? Object.fromEntries(kept) : undefined
}

/**
 * Applies limits to a state (the same object when it already fits).
 * @param {SuggestionUserState} state - State.
 * @param {Date} now - Now (expiry).
 * @param {Limits} limits - Limits.
 * @param {string|null} keepBucket - The bucket in use.
 * @returns {SuggestionUserState} The state.
 */
const applyLimits = (
  state: SuggestionUserState,
  now: Date,
  limits: Limits,
  keepBucket: string | null
): SuggestionUserState => {
  // the survey in use keeps all its targets: they are the user's current work
  const targetsOf = (bucket: string): number => (bucket === keepBucket ? Infinity : limits.targets)
  const pending = capBuckets(
    mapEntries(state.pending, (items, bucket) => {
      const alive = withoutExpired(items, now)
      return alive && capPendingTargets(alive, targetsOf(bucket))
    }),
    limits.buckets,
    keepBucket,
    state.touchedAt
  )
  const dismissed = capBuckets(
    mapEntries(state.dismissed, (ids, bucket) =>
      mapEntries(ids, (entry, id) => capDismissed(entry, limits.dismissed, pendingKeysOf(state.pending[bucket], id)))
    ),
    limits.buckets,
    keepBucket,
    state.touchedAt
  )
  const inProgress = capBuckets(
    mapEntries(state.inProgress, (ids, bucket) =>
      mapEntries<InProgressEntry>(ids, (entry) => capTargets(entry, targetsOf(bucket)))
    ),
    limits.buckets,
    keepBucket,
    state.touchedAt
  )
  const seenModules =
    state.seenModules.length > limits.modules ? state.seenModules.slice(-limits.modules) : state.seenModules
  const touchedAt = pruneTouchedAt(state.touchedAt, [pending, dismissed, inProgress])
  const unchanged =
    pending === state.pending &&
    dismissed === state.dismissed &&
    inProgress === state.inProgress &&
    seenModules === state.seenModules &&
    touchedAt === state.touchedAt
  return unchanged ? state : { pending, dismissed, inProgress, seenModules, ...(touchedAt ? { touchedAt } : {}) }
}

/**
 * Returns the state as it is kept between writes: expired suggestions removed and the caps applied.
 * @param {SuggestionUserState} state - State.
 * @param {Date} now - Now.
 * @param {object} [options] - Options.
 * @param {string|null} [options.keepBucket] - The bucket being written, which is never dropped.
 * @returns {SuggestionUserState} The state (the same object when it already fits).
 */
export const normalizeSuggestionState = (
  state: SuggestionUserState,
  now: Date,
  { keepBucket = null }: { keepBucket?: string | null } = {}
): SuggestionUserState => applyLimits(state, now, NORMAL_LIMITS, keepBucket)

/**
 * Returns a smaller state for a full storage: level 1 tightens the caps, level 2 also forgets the dismissed targets (those of the survey in use stay),
 * level 3 keeps only what is running (in progress) and the modules seen.
 * @param {SuggestionUserState} state - State.
 * @param {number} level - Shrink level, from 1.
 * @param {Date} now - Now.
 * @param {object} [options] - Options.
 * @param {string|null} [options.keepBucket] - The bucket being written, which is never dropped.
 * @returns {SuggestionUserState|null} The state; null past the last level (nothing left to cut).
 */
export const shrinkSuggestionState = (
  state: SuggestionUserState,
  level: number,
  now: Date,
  { keepBucket = null }: { keepBucket?: string | null } = {}
): SuggestionUserState | null => {
  if (level > LAST_SHRINK_LEVEL) return null
  const tight = applyLimits(state, now, TIGHT_LIMITS, keepBucket)
  if (level === 1) return tight
  // the survey in use keeps its dismissals: a Dismiss that hit the quota must not undo itself
  if (level === 2) {
    const kept = keepBucket === null ? undefined : tight.dismissed[keepBucket]
    return { ...tight, dismissed: kept ? { [keepBucket as string]: kept } : {} }
  }
  return {
    ...emptySuggestionState(),
    inProgress: tight.inProgress,
    seenModules: tight.seenModules,
    ...(tight.touchedAt ? { touchedAt: tight.touchedAt } : {}),
  }
}

/**
 * Records that a bucket was just written, at hour precision: a write that keeps the time of the last hour leaves the
 * state as it is, so an update that changes nothing stays a no-op.
 * @param {SuggestionUserState} state - State.
 * @param {string|null} bucket - The bucket written (null: none).
 * @param {Date} now - Now.
 * @returns {SuggestionUserState} The state (the same object when the time is recent enough).
 */
export const withBucketTouched = (
  state: SuggestionUserState,
  bucket: string | null,
  now: Date
): SuggestionUserState => {
  if (bucket === null || bucket === HELP_BUCKET) return state
  const last = state.touchedAt?.[bucket]
  if (last !== undefined && now.getTime() - last < TOUCH_PRECISION_MS) return state
  return { ...state, touchedAt: { ...state.touchedAt, [bucket]: now.getTime() } }
}
