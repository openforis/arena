import { useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'
import { collectDescendantPageUuids, collectPageNodeDefs, pageHasOwnErrors } from './recordPageValidation'

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
    const pageNodeDefs = collectPageNodeDefs(survey, cycle)
    const totalCount = pageNodeDefs.length
    if (totalCount === 0) return null

    let validCount = 0
    for (const pageNodeDef of pageNodeDefs) {
      const pageNodeDefUuid = NodeDef.getUuid(pageNodeDef)
      const descendantPageUuids = collectDescendantPageUuids(survey, cycle, pageNodeDef)
      if (!pageHasOwnErrors({ pageNodeDefUuid, descendantPageUuids, record })) {
        validCount += 1
      }
    }

    const percent = Math.round((validCount / totalCount) * 100)
    return { percent, validCount, totalCount }
  }, Objects.isEqual)
}
