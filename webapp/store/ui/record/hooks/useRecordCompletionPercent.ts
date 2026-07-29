import { useSelector } from 'react-redux'

import { Records } from '@openforis/arena-core'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'

/**
 * Returns the overall completion percentage of the current record as a
 * number in [0, 100], or null when no record is loaded.
 *
 * @returns {number | null} Completion percentage, or null if no record is loaded.
 */
export const useRecordCompletionPercent = (): number | null => {
  return useSelector((state): number | null => {
    const record = RecordState.getRecord(state)
    if (!record) return null

    const survey = SurveyState.getSurvey(state)
    return Records.getRecordCompletionPercent({ survey, record })
  })
}
