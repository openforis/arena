/**
 * The entry point of views, buttons and the middleware for suggestion events; the suggestions host subscribes to it.
 */
import type { SuggestionEvent } from './detectors/types'

type SuggestionEventListener = (event: SuggestionEvent) => void

const listeners = new Set<SuggestionEventListener>()

/**
 * Subscribes to the suggestion events.
 * @param {Function} listener - Receives each event.
 * @returns {Function} Unsubscribes.
 */
export const subscribeSuggestionEvents = (listener: SuggestionEventListener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Sends an event to the subscribers; a failing subscriber never breaks the view that notified.
 * @param {SuggestionEvent} event - Event.
 * @returns {void}
 */
export const notifySuggestionEvent = (event: SuggestionEvent): void => {
  for (const listener of [...listeners]) {
    try {
      listener(event)
    } catch {
      // suggestions are optional: the click or the navigation goes on
    }
  }
}
