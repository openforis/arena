/**
 * What the user sees: the targets of a suggestion that are neither in progress nor dismissed (a counted target that
 * grew by its step since the dismissal shows again), and the area, expiry and cycle rules.
 */
import { SUGGESTION_GROWTH_STEPS, type AssistantSuggestion, type SuggestionKind, type SuggestionTarget } from '../types'
import { getPendingOf } from './pending'
import { getNested, own } from './records'
import { HELP_BUCKET, toBucket, type SuggestionUserState, type VisibilityParams } from './types'

/**
 * Returns true when a dismissed counted target grew by at least its kind's step.
 * @param {SuggestionKind} kind - Kind.
 * @param {SuggestionTarget} target - Current target.
 * @param {number|true} seen - Value recorded at the dismissal.
 * @returns {boolean} True when it shows again.
 */
const hasGrown = (kind: SuggestionKind, target: SuggestionTarget, seen: number | true): boolean => {
  const step = SUGGESTION_GROWTH_STEPS[kind]
  return typeof seen === 'number' && step !== null && target.count !== undefined && target.count >= seen + step
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
  const dismissed = getNested(state.dismissed, bucket, suggestion.id)?.targets ?? {}
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
