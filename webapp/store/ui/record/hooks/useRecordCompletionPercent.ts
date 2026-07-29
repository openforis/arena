import { useSelector } from 'react-redux'

import { Records } from '@openforis/arena-core'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'

/**
 * Returns the overall completion percentage of the current record as a
 * number in [0, 100], or null if the arena-core completion API is not yet
 * available or no record is loaded.
 */
export const useRecordCompletionPercent = (): number | null => {
  return useSelector((state) => {
    const record = RecordState.getRecord(state)
    if (!record) return null

    // Forward-compat: arena-core may not yet export getCompletionPercent.
    // Remove the optional-chaining guard once the API is published.
    const getCompletionPercent = (Records as Record<string, unknown>)['getCompletionPercent'] as
      | ((record: unknown) => number)
      | undefined

    if (typeof getCompletionPercent !== 'function') return null

    const survey = SurveyState.getSurvey(state)
    return getCompletionPercent({ survey, record })
  })
}
