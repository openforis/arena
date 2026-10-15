/**
 * The entry point of views, buttons and the middleware for suggestion events; the suggestions host subscribes to it.
 */
import { logAiWarning, type AiLog } from '@webapp/ai/log/aiLog'

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
 * @param {AiLog} [log] - Reports a failing subscriber.
 * @returns {void}
 */
export const notifySuggestionEvent = (event: SuggestionEvent, log: AiLog = logAiWarning): void => {
  for (const listener of [...listeners]) {
    try {
      listener(event)
    } catch (error) {
      // suggestions are optional: the click or the navigation goes on
      log(`A suggestion listener failed on ${event.type}`, error)
    }
  }
}
