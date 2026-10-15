/**
 * The validation report tells the suggestions it was opened (the validation errors suggestion counts the cycle's messages then). With AI
 * off the Cleaning area is not available, and the report does not even say it opened.
 */
import { notifySuggestionEvent } from './suggestionEvents'
import type { SuggestionEvent } from './detectors/types'

/**
 * Sends validationReportOpened when the Cleaning area is available.
 * @param {object} params - Parameters.
 * @param {string|null} params.cycle - The open cycle.
 * @param {boolean} params.askAssistantAvailable - True when the Cleaning area is available.
 * @param {Function} [params.notify] - Sends an event (the suggestion events by default).
 * @returns {void}
 */
export const notifyValidationReportOpened = ({
  cycle,
  askAssistantAvailable,
  notify = notifySuggestionEvent,
}: {
  cycle: string | null
  askAssistantAvailable: boolean
  notify?: (event: SuggestionEvent) => void
}): void => {
  if (cycle && askAssistantAvailable) notify({ type: 'validationReportOpened', cycle })
}
