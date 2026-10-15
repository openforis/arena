/**
 * Suggestions of one user as stored under `arena.ai.suggestions.<userUuid>`, and the rules of the spec (§3.2) as pure
 * functions: dismissal by target, growth steps, in progress, visibility, pruning and bounds. The code is split by
 * concern in ./state; the store wraps these functions with localStorage.
 */
export { MAX_SEEN_MODULES, MAX_SURVEY_BUCKETS, normalizeSuggestionState, shrinkSuggestionState } from './state/bounds'
export { withDismissed } from './state/dismissed'
export { withModuleSeen } from './state/modules'
export { parseSuggestionState } from './state/parse'
export { getPendingOf, withAdded, withoutSuggestion } from './state/pending'
export { getBucketOfConversation, getInProgressConversationIds, withProgress, withSettled } from './state/progress'
export { getTrackedOf, withKind, withoutBucket, withoutTargets } from './state/prune'
export {
  HELP_BUCKET,
  emptySuggestionState,
  toBucket,
  type DismissedEntry,
  type DismissedTargets,
  type InProgressEntry,
  type SuggestionUserState,
  type TrackedSuggestion,
  type VisibilityParams,
} from './state/types'
export { getVisibleTargets, selectVisible } from './state/visibility'
