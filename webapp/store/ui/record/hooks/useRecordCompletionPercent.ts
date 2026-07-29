import { useSelector } from 'react-redux'

import { Records } from '@openforis/arena-core'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'

type RecordCompletionParams = {
  survey: ReturnType<typeof SurveyState.getSurvey>
  record: NonNullable<ReturnType<typeof RecordState.getRecord>>
}

type GetRecordCompletionPercent = (params: RecordCompletionParams) => number

const getRecordCompletionPercent = (): GetRecordCompletionPercent | undefined => {
  const fn = (Records as Record<string, unknown>).getRecordCompletionPercent
  return typeof fn === 'function' ? (fn as GetRecordCompletionPercent) : undefined
}

/**
 * Returns the overall completion percentage of the current record as a
 * number in [0, 100], or null when the arena-core completion API is unavailable
 * or no record is loaded.
 *
 * @returns {number | null} Completion percentage, or null if unavailable.
 */
export const useRecordCompletionPercent = (): number | null => {
  return useSelector((state): number | null => {
    const record = RecordState.getRecord(state)
    if (!record) return null

    const getCompletionPercent = getRecordCompletionPercent()
    if (!getCompletionPercent) return null

    const survey = SurveyState.getSurvey(state)
    return getCompletionPercent({ survey, record })
  })
}
