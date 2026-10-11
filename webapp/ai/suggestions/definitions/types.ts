/**
 * How a suggestion is shown (card) and what Do it sends (prompt), both built from its visible targets only.
 */
import type { SuggestionStore } from '../suggestionStore'
import type { AssistantSuggestion, SuggestionKind } from '../types'

export type SuggestionDescribeContext = {
  survey: any | null
  t: (key: string, params?: Record<string, unknown>) => string
  lang: string
}

export type SuggestionDefinition = {
  kind: SuggestionKind
  // i18n key under aiSuggestions and its params, built from the VISIBLE targets only
  card: (
    suggestion: AssistantSuggestion,
    ctx: SuggestionDescribeContext
  ) => { key: string; params: Record<string, unknown> }
  // English prompt, built from the visible targets only
  prompt: (suggestion: AssistantSuggestion, ctx: SuggestionDescribeContext) => string
  // what Do it does to the suggestion: in progress until its cards settle (default), or removed (no card expected)
  acceptMode?: 'progress' | 'remove'
  // after Do it or Dismiss, with the targets handled (the module introduction records the module as seen)
  onHandled?: (params: { userUuid: string; targetKeys: string[]; store: SuggestionStore }) => void
}
