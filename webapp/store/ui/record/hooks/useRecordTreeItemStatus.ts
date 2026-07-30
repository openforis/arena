import { useSelector } from 'react-redux'

import { Objects, Records } from '@openforis/arena-core'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import { SurveyState } from '@webapp/store/survey'
import { SurveyFormState } from '@webapp/store/ui/surveyForm'
import * as RecordState from '../state'

export type TreeItemStatus = {
  hasErrors: boolean
  hasWarnings: boolean
  isComplete: boolean
}

type Params = {
  pageNodeDefUuid: string
  descendantPageUuids: string[]
  isTreeItemExpanded: boolean
}

type RecordType = NonNullable<ReturnType<typeof RecordState.getRecord>>

const nodeBelongsToPage = (node: object, pageNodeDefUuid: string, record: RecordType) => {
  if (Node.getNodeDefUuid(node) === pageNodeDefUuid) return true
  return Node.getHierarchy(node).some((ancestorUuid: string) => {
    const ancestor = Record.getNodeByUuid(ancestorUuid)(record)
    return ancestor && Node.getNodeDefUuid(ancestor) === pageNodeDefUuid
  })
}

const getPageValidation = (pageNodeDefUuid: string, record: RecordType) => {
  const recordValidation = Record.getValidation(record)
  const fields = Validation.getFieldValidations(recordValidation)
  let hasErrors = false
  let hasWarnings = false
  for (const nodeUuid of Object.keys(fields)) {
    const node = Record.getNodeByUuid(nodeUuid)(record)
    if (!node || !nodeBelongsToPage(node, pageNodeDefUuid, record)) continue
    const nodeValidation = RecordValidation.getNodeValidation(node)(recordValidation)
    if (!nodeValidation) continue
    if (Validation.isError(nodeValidation)) hasErrors = true
    if (Validation.isWarning(nodeValidation)) hasWarnings = true
    if (hasErrors && hasWarnings) break
  }
  return { hasErrors, hasWarnings }
}

const getPageCompletionPercent = (pageNodeDefUuid: string, state: unknown): number | null => {
  const record = RecordState.getRecord(state)
  if (!record) return null
  const getFn = (Records as Record<string, unknown>).getEntityCompletionPercent
  if (typeof getFn !== 'function') return null
  const pagesUuidMap = SurveyFormState.getPagesUuidMap(state)
  const pageNodeUuid = pagesUuidMap?.[pageNodeDefUuid]
  if (!pageNodeUuid) return null
  const entity = Record.getNodeByUuid(pageNodeUuid)(record)
  if (!entity) return null
  const survey = SurveyState.getSurvey(state)
  return (getFn as (p: { survey: unknown; record: unknown; entity: unknown }) => number)({
    survey,
    record,
    entity,
  })
}

/**
 * Returns status for a sidebar tree page item. When the item is expanded,
 * only that page is considered. When collapsed, status rolls up across the
 * page and all descendant page UUIDs in the rendered tree subtree.
 *
 * @param pageNodeDefUuid - UUID of this tree item's page node def
 * @param descendantPageUuids - Page node def UUIDs under this item in the tree
 * @param isTreeItemExpanded - Whether this tree item is currently expanded
 * @returns Aggregated error/warning/complete flags
 */
export const useRecordTreeItemStatus = ({
  pageNodeDefUuid,
  descendantPageUuids,
  isTreeItemExpanded,
}: Params): TreeItemStatus => {
  return useSelector((state): TreeItemStatus => {
    const record = RecordState.getRecord(state)
    if (!record) return { hasErrors: false, hasWarnings: false, isComplete: false }

    const scopedUuids = isTreeItemExpanded ? [pageNodeDefUuid] : [pageNodeDefUuid, ...descendantPageUuids]

    let hasErrors = false
    let hasWarnings = false
    let allComplete = scopedUuids.length > 0

    for (const uuid of scopedUuids) {
      const { hasErrors: pageErrors, hasWarnings: pageWarnings } = getPageValidation(uuid, record)
      if (pageErrors) hasErrors = true
      if (pageWarnings) hasWarnings = true
      const percent = getPageCompletionPercent(uuid, state)
      if (percent !== 100) allComplete = false
    }

    return {
      hasErrors,
      hasWarnings,
      isComplete: allComplete && !hasErrors && !hasWarnings,
    }
  }, Objects.isEqual)
}
