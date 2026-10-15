/**
 * Redux middleware that derives suggestion events from the actions the store already sees: a succeeded job (suggestion
 * 8, and a category import for suggestion 6), the survey info saved, a category deleted. It reads only the action.
 */
import type { Middleware } from 'redux'

import * as JobSerialized from '@common/job/jobSerialized'
import { logAiWarning } from '@webapp/ai/log/aiLog'
import { JOB_UPDATE } from '@webapp/store/app/job/actions'
import { surveyCategoryDelete } from '@webapp/store/survey/actions/actionTypes'
import { surveyInfoUpdate } from '@webapp/store/survey/surveyInfo/actions'

import type { SuggestionEvent } from './detectors'
import { notifySuggestionEvent } from './suggestionEvents'

type Notify = (event: SuggestionEvent) => void

// jobs that change the categories of the survey
const CATEGORY_JOB_TYPES = new Set(['CategoryImportJob', 'CategoriesBatchImportJob'])

// events sent once the code that dispatched the action finished its dispatches: saving the survey info resets the defs
// right after, and the event must find the new defs, not the old ones
const DEFERRED_EVENTS: SuggestionEvent['type'][] = ['surveyInfoSaved']

/**
 * Returns the events of a job update: only a succeeded job is one.
 * @param {any} job - Serialized job (null when the monitor is reset).
 * @returns {SuggestionEvent[]} The events.
 */
const getJobEvents = (job: any): SuggestionEvent[] => {
  if (!job || !JobSerialized.isSucceeded(job)) return []
  const events: SuggestionEvent[] = [{ type: 'jobSucceeded', job }]
  if (CATEGORY_JOB_TYPES.has(JobSerialized.getType(job))) events.push({ type: 'categoriesChanged' })
  return events
}

/**
 * Returns the suggestion events of an action.
 * @param {any} action - Redux action.
 * @returns {SuggestionEvent[]} The events (none for most actions).
 */
const getEvents = (action: any): SuggestionEvent[] => {
  switch (action?.type) {
    case JOB_UPDATE:
      return getJobEvents(action.job)
    case surveyInfoUpdate:
      // a new language can leave category item labels missing (suggestion 6)
      return [{ type: 'surveyInfoSaved' }]
    case surveyCategoryDelete:
      return [{ type: 'categoriesChanged' }]
    default:
      return []
  }
}

/**
 * Creates the middleware.
 * @param {Notify} notify - Receives the events.
 * @param {Function} [log] - Reports a listener that failed.
 * @returns {Middleware} The middleware.
 */
export const createAiSuggestionsMiddleware =
  (notify: Notify, log: (message: string, error?: unknown) => void = logAiWarning): Middleware =>
  () =>
  (next) =>
  (action: any) => {
    const result = next(action)
    /**
     * Sends an event; a suggestion must never break the app's dispatch.
     * @param {SuggestionEvent} event - Event.
     * @returns {void}
     */
    const send = (event: SuggestionEvent): void => {
      try {
        notify(event)
      } catch (error) {
        log(`A suggestion listener failed on ${event.type}`, error)
      }
    }
    for (const event of getEvents(action)) {
      if (DEFERRED_EVENTS.includes(event.type)) queueMicrotask(() => send(event))
      else send(event)
    }
    return result
  }

export const aiSuggestionsMiddleware = createAiSuggestionsMiddleware(notifySuggestionEvent)
