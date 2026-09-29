import { useSelector } from 'react-redux'

import { Objects, Records } from '@openforis/arena-core'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'
import { TreeItemStatus } from './useRecordTreeItemStatus'

const EMPTY: TreeItemStatus = { hasErrors: false, hasWarnings: false, isComplete: false }

/**
 * Returns validation/completion status for one entity instance's full subtree.
 *
 * @param entityInternalId - Entity node internal ID, or null/undefined when none is selected
 * @returns Subtree status flags, or empty status when the internal ID is missing
 */
export const useEntitySubtreeStatus = (entityInternalId?: number | null): TreeItemStatus =>
  useSelector((state): TreeItemStatus => {
    if (!entityInternalId) return EMPTY
    const record = RecordState.getRecord(state)
    const survey = SurveyState.getSurvey(state)
    if (!record || !survey) return EMPTY
    const status = Records.getEntitySubtreeStatus({ survey, record, entityInternalId })
    return status ?? EMPTY
  }, Objects.isEqual)
