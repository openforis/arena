/**
 * Proactive suggestions of the assistant: what a detector found and the user may accept with Do it.
 */
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

// the list of kinds, each with the step its counted targets must grow by to show again after a dismissal (null: the
// targets are not counted). A new kind is added here, then in ./registry (a kind without an entry does not compile).
export const SUGGESTION_GROWTH_STEPS = {
  missingTranslations: null,
  newEntriesDescriptions: null,
  publishErrors: null,
  entityWithoutKey: null,
  attributeWithoutRef: null,
  categoryItemTranslations: 10,
  validationErrors: 20,
  dataImported: null,
  moduleIntro: null,
} as const satisfies Record<string, number | null>

export type SuggestionKind = keyof typeof SUGGESTION_GROWTH_STEPS

/**
 * Tells whether a value is one of the kinds (stored data may hold one that this version does not know).
 * @param {unknown} value - Value.
 * @returns {boolean} True for a kind.
 */
export const isSuggestionKind = (value: unknown): value is SuggestionKind =>
  typeof value === 'string' && Object.hasOwn(SUGGESTION_GROWTH_STEPS, value)

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
