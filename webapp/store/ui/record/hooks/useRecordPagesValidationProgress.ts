import { useSelector } from 'react-redux'

import { Objects, Records } from '@openforis/arena-core'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'

export type PagesValidationProgress = {
  percent: number
  validCount: number
  totalCount: number
}

/**
 * Returns progress of pages without own-field validation errors over all
 * survey pages. Matches the sidebar red-icon signal (errors only; warnings
 * do not reduce the score).
 *
 * @returns Progress stats, or null when no record / no pages
 */
export const useRecordPagesValidationProgress = (): PagesValidationProgress | null => {
  return useSelector((state): PagesValidationProgress | null => {
    const record = RecordState.getRecord(state)
    if (!record) return null

    const survey = SurveyState.getSurvey(state)
    const cycle = SurveyState.getSurveyCycleKey(state)
    return Records.getRecordPagesValidationProgress({ survey, record, cycle })
  }, Objects.isEqual)
}
