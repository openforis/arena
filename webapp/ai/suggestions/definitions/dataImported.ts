/**
 * Card and prompt of suggestion 8 (records imported, Analysis area).
 */
import { DATA_IMPORTED_PROMPT } from '../prompts/dataImported'
import type { AssistantSuggestion } from '../types'
import { formatSuggestionCount } from './formatSuggestionCount'
import type { SuggestionDefinition, SuggestionDescribeContext } from './types'

export const DATA_IMPORTED_CARD_KEY = 'dataImported.card'
// a separate text for exactly one record: no language depends on i18next plural suffixes
export const DATA_IMPORTED_CARD_ONE_KEY = 'dataImported.cardOne'

export const dataImportedDefinition: SuggestionDefinition = {
  kind: 'dataImported',
  /**
   * Returns the card text key with the number of records of the visible import.
   * @param {AssistantSuggestion} suggestion - The suggestion (visible targets only).
   * @param {SuggestionDescribeContext} ctx - Describe context.
   * @returns {{key: string, params: object}} The i18n key and its params.
   */
  card: (suggestion: AssistantSuggestion, { lang }: SuggestionDescribeContext) => {
    const count = suggestion.targets[0]?.count ?? 0
    if (count === 1) return { key: DATA_IMPORTED_CARD_ONE_KEY, params: {} }
    return { key: DATA_IMPORTED_CARD_KEY, params: { count: formatSuggestionCount(count, lang) } }
  },
  /**
   * Returns the prompt.
   * @returns {string} The prompt.
   */
  prompt: () => DATA_IMPORTED_PROMPT,
}
