/**
 * Display rules of the suggestions: which areas count, how cards group, the assistant button label, the card text.
 */
import type { SuggestionDescribeContext } from '@webapp/ai/suggestions/definitions'
import type { SuggestionDefinitions } from '@webapp/ai/suggestions/suggestionActions'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'

import type { AssistantArea, AssistantAreaStatus } from '../assistantAreas'

// setTimeout's largest delay
const MAX_TIMER_MS = 2_147_483_647

export type SuggestionsByArea = Partial<Record<AssistantArea, AssistantSuggestion[]>>

// suggestions on the home page; "See all" lists the others
export const START_SCREEN_SUGGESTION_COUNT = 3

/**
 * Returns the suggestions the home page shows and how many there are in all.
 * @param {Array} items - Suggestions (or their cards), in order.
 * @returns {{shown: Array, total: number}} The first ones and the total.
 */
export const getStartScreenSuggestions = <T>(items: T[]): { shown: T[]; total: number } => ({
  shown: items.slice(0, START_SCREEN_SUGGESTION_COUNT),
  total: items.length,
})

/**
 * Returns the areas whose suggestions may show: the available ones (an unavailable area hides them, they stay stored).
 * @param {AssistantAreaStatus[]} statuses - Area statuses.
 * @returns {AssistantArea[]} The available areas.
 */
export const getAvailableAreas = (statuses: AssistantAreaStatus[]): AssistantArea[] =>
  statuses.filter((status) => status.status === 'available').map((status) => status.area)

/**
 * Groups suggestions by area, keeping their order.
 * @param {AssistantSuggestion[]} suggestions - Suggestions.
 * @returns {SuggestionsByArea} The suggestions of each area.
 */
export const groupSuggestionsByArea = (suggestions: AssistantSuggestion[]): SuggestionsByArea => {
  const byArea: SuggestionsByArea = {}
  for (const suggestion of suggestions) byArea[suggestion.area] = [...(byArea[suggestion.area] ?? []), suggestion]
  return byArea
}

/**
 * Returns true when Do it may run: the conversation store is open and neither an answer nor an Apply runs.
 * @param {object} api - Conversation state.
 * @param {boolean} api.ready - The conversation store is open.
 * @param {boolean} api.busy - An answer runs.
 * @param {boolean} api.applying - An Apply runs.
 * @returns {boolean} True when enabled.
 */
export const canDoIt = ({ ready, busy, applying }: { ready: boolean; busy: boolean; applying: boolean }): boolean =>
  ready && !busy && !applying

/**
 * Returns the label of the assistant button: "AI assistant: N suggestions" while suggestions wait.
 * @param {object} params - Parameters.
 * @param {number} params.count - Visible suggestions.
 * @param {Function} params.t - Translates.
 * @returns {string} The label.
 */
export const getAssistantButtonLabel = ({ count, t }: { count: number; t: SuggestionDescribeContext['t'] }): string =>
  count > 0 ? t('aiSuggestions:buttonLabel', { count }) : t('aiAssistant.open')

/**
 * Returns the text of a card, or null when the suggestion cannot be described (its card throws).
 * @param {object} params - Parameters.
 * @param {AssistantSuggestion} params.suggestion - Visible suggestion.
 * @param {SuggestionDescribeContext} params.describeContext - Survey, translation and language.
 * @param {SuggestionDefinitions} params.definitions - Definitions.
 * @returns {string|null} The text.
 */
export const getSuggestionCardText = ({
  suggestion,
  describeContext,
  definitions,
}: {
  suggestion: AssistantSuggestion
  describeContext: SuggestionDescribeContext
  definitions: SuggestionDefinitions
}): string | null => {
  try {
    const { key, params } = definitions[suggestion.kind].card(suggestion, describeContext)
    return describeContext.t(`aiSuggestions:${key}`, params)
  } catch {
    // a broken suggestion never breaks the panel
    return null
  }
}

/**
 * Returns the delay until the nearest expiry, so the cards hide on time.
 * @param {AssistantSuggestion[]} suggestions - Visible suggestions.
 * @param {Date} now - Now.
 * @returns {number|null} The delay in ms (0 when past); null when nothing expires.
 */
export const getNextExpiryDelay = (suggestions: AssistantSuggestion[], now: Date): number | null => {
  let next: number | null = null
  for (const { expiresAt } of suggestions) {
    const time = expiresAt === null ? Number.NaN : Date.parse(expiresAt)
    if (Number.isNaN(time)) continue
    const delay = Math.max(time - now.getTime(), 0)
    if (next === null || delay < next) next = delay
  }
  return next === null ? null : Math.min(next, MAX_TIMER_MS)
}
