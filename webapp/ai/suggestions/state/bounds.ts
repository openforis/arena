/**
 * How big the stored state may get: expired suggestions go, and buckets, targets and seen modules are capped, so the
 * localStorage entry of a user stays small however long the browser is used. When the storage is full anyway, the store
 * asks for a smaller state (shrink levels).
 */
import type { AssistantSuggestion } from '../types'
import {
  HELP_BUCKET,
  emptySuggestionState,
  type DismissedEntry,
  type InProgressEntry,
  type SuggestionUserState,
} from './types'

// surveys with stored suggestions (Help does not count); the survey being written is never dropped
export const MAX_SURVEY_BUCKETS = 20
// targets of one pending suggestion or one in-progress entry (a card never asks the model for more than this)
export const MAX_TARGETS_PER_ENTRY = 200
// dismissed targets of one suggestion (the latest dismissals)
export const MAX_DISMISSED_PER_SUGGESTION = 200
export const MAX_SEEN_MODULES = 50

type Limits = { buckets: number; targets: number; dismissed: number; modules: number }

const NORMAL_LIMITS: Limits = {
  buckets: MAX_SURVEY_BUCKETS,
  targets: MAX_TARGETS_PER_ENTRY,
  dismissed: MAX_DISMISSED_PER_SUGGESTION,
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
 * Keeps the last `max` survey buckets of a record. Bucket keys are survey ids, which a JS object keeps in ascending
 * order, so the dropped ones are the lowest ids (the oldest surveys), except the Help bucket and the bucket in use.
 * @param {Record<string, T>} record - Record by bucket.
 * @param {number} max - Survey buckets to keep.
 * @param {string|null} keepBucket - A bucket that is never dropped.
 * @returns {Record<string, T>} The record.
 */
const capBuckets = <T>(record: Record<string, T>, max: number, keepBucket: string | null): Record<string, T> => {
  const surveyBuckets = Object.keys(record).filter((bucket) => bucket !== HELP_BUCKET)
  const excess = surveyBuckets.length - max
  if (excess <= 0) return record
  const dropped = new Set(surveyBuckets.filter((bucket) => bucket !== keepBucket).slice(0, excess))
  return Object.fromEntries(Object.entries(record).filter(([bucket]) => !dropped.has(bucket)))
}

/**
 * Keeps the first targets of a suggestion or an in-progress entry.
 * @param {object} entry - Suggestion or in-progress entry.
 * @param {number} max - Targets to keep.
 * @returns {object} The entry (the same one when within the cap).
 */
const capTargets = <T extends { targets: { key: string }[] }>(entry: T, max: number): T =>
  entry.targets.length <= max ? entry : { ...entry, targets: entry.targets.slice(0, max) }

/**
 * Keeps the latest dismissed targets of a suggestion (they are recorded in order).
 * @param {DismissedEntry} entry - Entry.
 * @param {number} max - Targets to keep.
 * @returns {DismissedEntry} The entry (the same one when within the cap).
 */
const capDismissed = (entry: DismissedEntry, max: number): DismissedEntry => {
  const keys = Object.keys(entry.targets)
  if (keys.length <= max) return entry
  return { ...entry, targets: Object.fromEntries(Object.entries(entry.targets).slice(-max)) }
}

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
  const pending = capBuckets(
    mapEntries(state.pending, (items) => {
      const alive = withoutExpired(items, now)
      return alive && capPendingTargets(alive, limits.targets)
    }),
    limits.buckets,
    keepBucket
  )
  const dismissed = capBuckets(
    mapEntries(state.dismissed, (ids) => mapEntries(ids, (entry) => capDismissed(entry, limits.dismissed))),
    limits.buckets,
    keepBucket
  )
  const inProgress = capBuckets(
    mapEntries(state.inProgress, (ids) =>
      mapEntries<InProgressEntry>(ids, (entry) => capTargets(entry, limits.targets))
    ),
    limits.buckets,
    keepBucket
  )
  const seenModules =
    state.seenModules.length > limits.modules ? state.seenModules.slice(-limits.modules) : state.seenModules
  const unchanged =
    pending === state.pending &&
    dismissed === state.dismissed &&
    inProgress === state.inProgress &&
    seenModules === state.seenModules
  return unchanged ? state : { pending, dismissed, inProgress, seenModules }
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
 * Returns a smaller state for a full storage: level 1 tightens the caps, level 2 also forgets the dismissed targets,
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
  if (level === 2) return { ...tight, dismissed: {} }
  return { ...emptySuggestionState(), inProgress: tight.inProgress, seenModules: tight.seenModules }
}
