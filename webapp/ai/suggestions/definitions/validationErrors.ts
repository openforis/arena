/**
 * Card and prompt of the validation errors suggestion (many validation messages, Cleaning area).
 */
import { VALIDATION_ERRORS_PROMPT } from '../prompts/validationErrors'
import type { AssistantSuggestion } from '../types'
import { formatSuggestionCount } from './formatSuggestionCount'
import type { SuggestionDefinition, SuggestionDescribeContext } from './types'

export const VALIDATION_ERRORS_CARD_KEY = 'validationErrors.card'

export const validationErrorsDefinition: SuggestionDefinition = {
  kind: 'validationErrors',
  settlesWithoutCard: true,
  /**
   * Returns the card text key with the count of the visible target.
   * @param {AssistantSuggestion} suggestion - The suggestion (visible targets only).
   * @param {SuggestionDescribeContext} ctx - Describe context.
   * @returns {{key: string, params: object}} The i18n key and its params.
   */
  card: (suggestion: AssistantSuggestion, { lang }: SuggestionDescribeContext) => ({
    key: VALIDATION_ERRORS_CARD_KEY,
    params: { count: formatSuggestionCount(suggestion.targets[0]?.count ?? 0, lang) },
  }),
  /**
   * Returns the prompt (the tool reads the cycle from the turn context; no record data here).
   * @returns {string} The prompt.
   */
  prompt: () => VALIDATION_ERRORS_PROMPT,
}
