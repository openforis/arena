/**
 * Reads the stored value: anything unexpected is dropped, a corrupt value is an empty state. A state written before the
 * kind was stored is read with the kind of the id prefix (`${kind}:${scope}`), once; entries of a kind this version
 * does not know are dropped, so every kind the rest of the code sees has its definition.
 */
import { isSuggestionKind, type AssistantSuggestion, type SuggestionKind, type SuggestionTarget } from '../types'
import { isPlainObject } from './records'
import { emptySuggestionState, type DismissedEntry, type InProgressEntry, type SuggestionUserState } from './types'

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
  isSuggestionKind(value.kind) &&
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
 * @param {Function} parseEntry - Receives the entry and its key; returns the parsed entry, or null to drop it.
 * @returns {Record<string, T>|null} The record, or null when nothing is left.
 */
const parseRecord = <T>(
  value: unknown,
  parseEntry: (entry: unknown, key: string) => T | null
): Record<string, T> | null => {
  if (!isPlainObject(value)) return null
  const entries: [string, T][] = []
  for (const [key, entry] of Object.entries(value)) {
    const parsed = parseEntry(entry, key)
    if (parsed !== null) entries.push([key, parsed])
  }
  return entries.length > 0 ? Object.fromEntries(entries) : null
}

/**
 * Returns the kind a legacy entry had: the prefix of its id.
 * @param {string} id - Suggestion id.
 * @returns {SuggestionKind|null} The kind; null when the prefix is not a kind.
 */
const getKindOfId = (id: string): SuggestionKind | null => {
  const separator = id.indexOf(':')
  const prefix = separator < 0 ? '' : id.slice(0, separator)
  return isSuggestionKind(prefix) ? prefix : null
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
 * Parses the dismissed entry of a suggestion: `{ kind, targets }`, or the legacy record of targets alone (its values
 * are never strings, so a string `kind` tells the new shape).
 * @param {unknown} value - Raw value.
 * @param {string} id - Suggestion id.
 * @returns {DismissedEntry|null} The entry, or null when invalid.
 */
const parseDismissedEntry = (value: unknown, id: string): DismissedEntry | null => {
  const isCurrent = isPlainObject(value) && typeof value.kind === 'string' && isPlainObject(value.targets)
  const kind = isCurrent ? value.kind : getKindOfId(id)
  if (!isSuggestionKind(kind)) return null
  const targets = parseRecord(isCurrent ? value.targets : value, parseDismissedValue)
  return targets ? { kind, targets } : null
}

/**
 * Parses the in-progress entry of a suggestion (the kind is missing in the legacy shape).
 * @param {unknown} value - Raw value.
 * @param {string} id - Suggestion id.
 * @returns {InProgressEntry|null} The entry, or null when invalid.
 */
const parseInProgressEntry = (value: unknown, id: string): InProgressEntry | null => {
  if (!isPlainObject(value) || typeof value.conversationId !== 'string' || !Array.isArray(value.targets)) return null
  const kind = value.kind === undefined ? getKindOfId(id) : value.kind
  if (!isSuggestionKind(kind)) return null
  const targets = value.targets.filter(isTarget)
  return targets.length > 0 ? { kind, conversationId: value.conversationId, targets } : null
}

/**
 * Parses the last-written times of the buckets: finite numbers only.
 * @param {unknown} value - Raw value.
 * @returns {Record<string, number>|null} The times, or null when none is valid.
 */
const parseTouchedAt = (value: unknown): Record<string, number> | null =>
  parseRecord(value, (time) => (typeof time === 'number' && Number.isFinite(time) ? time : null))

/**
 * Parses a stored value.
 * @param {string|null} raw - Stored JSON.
 * @param {Function} [onCorrupt] - Called when the value is not a state: it is dropped, and so are its dismissals.
 * @returns {SuggestionUserState} The state.
 */
export const parseSuggestionState = (
  raw: string | null,
  onCorrupt?: (error?: unknown) => void
): SuggestionUserState => {
  if (!raw) return emptySuggestionState()
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    onCorrupt?.(error)
    return emptySuggestionState()
  }
  if (!isPlainObject(parsed)) {
    onCorrupt?.()
    return emptySuggestionState()
  }
  const { pending, dismissed, inProgress, seenModules, touchedAt } = parsed
  const touched = parseTouchedAt(touchedAt)
  return {
    pending: parseRecord(pending, parsePendingBucket) ?? {},
    dismissed: parseRecord(dismissed, (bucket) => parseRecord(bucket, parseDismissedEntry)) ?? {},
    inProgress: parseRecord(inProgress, (bucket) => parseRecord(bucket, parseInProgressEntry)) ?? {},
    seenModules: Array.isArray(seenModules)
      ? [...new Set(seenModules.filter((item): item is string => typeof item === 'string'))]
      : [],
    ...(touched ? { touchedAt: touched } : {}),
  }
}
