import { useSelector } from 'react-redux'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import * as RecordState from '../state'

export type PageValidationStatus = {
  hasErrors: boolean
  hasWarnings: boolean
}

const nodeBelongsToPage = (node, pageNodeDefUuid, record) => {
  if (Node.getNodeDefUuid(node) === pageNodeDefUuid) return true

  return Node.getHierarchy(node).some((ancestorUuid) => {
    const ancestor = Record.getNodeByUuid(ancestorUuid)(record)
    return ancestor && Node.getNodeDefUuid(ancestor) === pageNodeDefUuid
  })
}

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

    const recordValidation = Record.getValidation(record)
    const fields = Validation.getFieldValidations(recordValidation)

    let hasErrors = false
    let hasWarnings = false

    for (const nodeUuid of Object.keys(fields)) {
      const node = Record.getNodeByUuid(nodeUuid)(record)
      if (!node) continue

      if (!nodeBelongsToPage(node, pageNodeDefUuid, record)) continue

      const nodeValidation = RecordValidation.getNodeValidation(node)(recordValidation)
      if (!nodeValidation) continue

      if (Validation.isError(nodeValidation)) hasErrors = true
      if (Validation.isWarning(nodeValidation)) hasWarnings = true

      if (hasErrors && hasWarnings) break
    }

    return { hasErrors, hasWarnings }
  })
}
