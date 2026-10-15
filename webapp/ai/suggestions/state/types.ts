/**
 * Shape of the suggestions of one user as stored under `arena.ai.suggestions.<userUuid>`.
 */
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

import type { AssistantSuggestion, SuggestionKind, SuggestionTarget } from '../types'

// target key → the count when dismissed (counted kinds) or true
export type DismissedTargets = Record<string, number | true>

// the kind is stored: a dismissal outlives its pending suggestion, and the id is not to be parsed for it
export type DismissedEntry = { kind: SuggestionKind; targets: DismissedTargets }

export type InProgressEntry = { kind: SuggestionKind; conversationId: string; targets: SuggestionTarget[] }

export type SuggestionUserState = {
  // bucket ("<surveyId>" or "help") → suggestions
  pending: Record<string, AssistantSuggestion[]>
  // bucket → suggestion id → dismissed targets
  dismissed: Record<string, Record<string, DismissedEntry>>
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

// a suggestion the state holds something of (pending, dismissed or in progress), with the keys of all its targets
export type TrackedSuggestion = { id: string; kind: SuggestionKind; targetKeys: string[] }

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
