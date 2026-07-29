import { useSelector } from 'react-redux'

import { Records } from '@openforis/arena-core'

import * as Record from '@core/record/record'

import { SurveyState } from '@webapp/store/survey'
import { SurveyFormState } from '@webapp/store/ui/surveyForm'
import * as RecordState from '../state'

/**
 * Returns the completion percentage of a page entity identified by its node
 * def UUID, or null when the page entity is not yet present in the record.
 *
 * @param pageNodeDefUuid - UUID of the page-entity node definition
 * @returns {number | null} Completion percentage in [0, 100], or null if unavailable
 */
export const useRecordPageCompletionPercent = (pageNodeDefUuid: string): number | null => {
  return useSelector((state): number | null => {
    const record = RecordState.getRecord(state)
    if (!record) return null

    const pagesUuidMap = SurveyFormState.getPagesUuidMap(state)
    const pageNodeUuid = pagesUuidMap?.[pageNodeDefUuid]
    if (!pageNodeUuid) return null

    const entity = Record.getNodeByUuid(pageNodeUuid)(record)
    if (!entity) return null

    const survey = SurveyState.getSurvey(state)
    return Records.getEntityCompletionPercent({ survey, record, entity })
  })
}
