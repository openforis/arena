/**
 * Proactive suggestions of the assistant: what a detector found and the user may accept with Do it.
 */
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

export type SuggestionKind =
  | 'missingTranslations'
  | 'newEntriesDescriptions'
  | 'publishErrors'
  | 'entityWithoutKey'
  | 'attributeWithoutRef'
  | 'categoryItemTranslations'
  | 'validationErrors'
  | 'dataImported'
  | 'moduleIntro'

export type SuggestionTarget = { key: string; count?: number }

export type AssistantSuggestion = {
  id: string // `${kind}:${scopeKey}`
  kind: SuggestionKind
  area: AssistantArea
  surveyId: number | null // null: Help (bucket 'help')
  cycle: string | null
  targets: SuggestionTarget[]
  createdAt: string // ISO
  expiresAt: string | null // ISO
}

// counted targets come back after a dismissal when the count grows by at least this step
export const SUGGESTION_GROWTH_STEPS: Partial<Record<SuggestionKind, number>> = {
  categoryItemTranslations: 10,
  validationErrors: 20,
}

// what the turn's tools may list for an accepted suggestion
export type SuggestionScope = { kind: SuggestionKind; targetKeys: string[] }

export type SuggestionRequest = {
  requestId: string
  userUuid: string
  surveyId: number | null
  cycle: string | null
  area: AssistantArea
  suggestionId: string
  scope: SuggestionScope
  // English prompt for the model
  prompt: string
  // what the chat shows as the user's message, in the interface language
  displayText: string
}

export type SettleOutcome = 'settled' | 'failed' // settled: every card applied or discarded; failed: error, stop, or no card
