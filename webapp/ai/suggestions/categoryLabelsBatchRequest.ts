/**
 * Do it of the category item translations suggestion: the card asks, the always-mounted batch host runs it (the card
 * unmounts when its suggestion goes in progress).
 */
import type { AssistantSuggestion } from './types'

type Listener = (suggestion: AssistantSuggestion) => void

let listener: Listener | null = null

/**
 * Registers the host that runs the batch.
 * @param {Function} next - Receives the suggestion of each Do it.
 * @returns {Function} Unregisters it.
 */
export const onCategoryLabelsBatchRequest = (next: Listener): (() => void) => {
  listener = next
  return () => {
    if (listener === next) listener = null
  }
}

/**
 * Asks the host to translate the category labels of a suggestion.
 * @param {AssistantSuggestion} suggestion - Visible suggestion (its targets are the categories).
 * @returns {void}
 */
export const requestCategoryLabelsBatch = (suggestion: AssistantSuggestion): void => listener?.(suggestion)
