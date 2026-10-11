/**
 * Redux middleware that tells the suggestion detectors about succeeded jobs (suggestion 8). It reads only the job.
 */
import type { Middleware } from 'redux'

import * as JobSerialized from '@common/job/jobSerialized'
import { JOB_UPDATE } from '@webapp/store/app/job/actions'

import type { SuggestionEvent } from './detectors'
import { notifySuggestionEvent } from './suggestionEvents'

type Notify = (event: SuggestionEvent) => void

/**
 * Tells whether an action is the update of a succeeded job.
 * @param {unknown} action - Redux action.
 * @returns {boolean} True for a succeeded job update.
 */
const isSucceededJobUpdate = (action: any): boolean =>
  action?.type === JOB_UPDATE && !!action.job && JobSerialized.isSucceeded(action.job)

/**
 * Creates the middleware.
 * @param {Notify} notify - Receives the jobSucceeded events.
 * @returns {Middleware} The middleware.
 */
export const createAiSuggestionsMiddleware =
  (notify: Notify): Middleware =>
  () =>
  (next) =>
  (action: any) => {
    const result = next(action)
    if (isSucceededJobUpdate(action)) {
      try {
        notify({ type: 'jobSucceeded', job: action.job })
      } catch {
        // a suggestion must never break the app's dispatch
      }
    }
    return result
  }

export const aiSuggestionsMiddleware = createAiSuggestionsMiddleware(notifySuggestionEvent)
