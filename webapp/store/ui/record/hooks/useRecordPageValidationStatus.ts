import { useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as RecordState from '../state'
import { getPageValidationStatus, type PageValidationStatus } from './recordPageValidation'

export type { PageValidationStatus }

/**
 * Returns aggregated validation status (errors / warnings) for all nodes
 * that belong to the page identified by pageNodeDefUuid.
 *
 * @param pageNodeDefUuid - UUID of the page-entity node definition
 * @returns PageValidationStatus with hasErrors and hasWarnings flags
 */
export const useRecordPageValidationStatus = (pageNodeDefUuid: string): PageValidationStatus => {
  return useSelector((state): PageValidationStatus => {
    const record = RecordState.getRecord(state)
    if (!record) return { hasErrors: false, hasWarnings: false }
    return getPageValidationStatus({ pageNodeDefUuid, record })
  }, Objects.isEqual)
}
