import { useSelector } from 'react-redux'

import { Objects, Records } from '@openforis/arena-core'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'
import { TreeItemStatus } from './useRecordTreeItemStatus'

const EMPTY: TreeItemStatus = { hasErrors: false, hasWarnings: false, isComplete: false }

/**
 * Returns validation/completion status for one entity instance's full subtree.
 *
 * @param entityUuid - Entity node UUID, or null/undefined when none is selected
 * @returns Subtree status flags, or empty status when uuid is missing
 */
export const useEntitySubtreeStatus = (entityUuid?: string | null): TreeItemStatus =>
  useSelector((state): TreeItemStatus => {
    if (!entityUuid) return EMPTY
    const record = RecordState.getRecord(state)
    const survey = SurveyState.getSurvey(state)
    if (!record || !survey) return EMPTY
    const status = Records.getEntitySubtreeStatus({ survey, record, entityUuid })
    return status ?? EMPTY
  }, Objects.isEqual)
