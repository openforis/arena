import { useSelector } from 'react-redux'

import { Objects, Records } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
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
  /** Direct tree-subtree descendants of this page (page node def UUIDs). */
  descendantPageUuids: string[]
  /**
   * For each page UUID in this item's subtree (including self), the list of
   * descendant page UUIDs under that page. Used for correct own-page scoping
   * during collapsed rollup.
   */
  descendantPageUuidsByPage: Record<string, string[]>
  isTreeItemExpanded: boolean
}

type RecordType = NonNullable<ReturnType<typeof RecordState.getRecord>>

/**
 * Whether a node belongs under a page entity (itself or any descendant of that page).
 */
const nodeBelongsToPage = (node: object, pageNodeDefUuid: string, record: RecordType) => {
  if (Node.getNodeDefUuid(node) === pageNodeDefUuid) return true
  return Node.getHierarchy(node).some((ancestorUuid: string) => {
    const ancestor = Record.getNodeByUuid(ancestorUuid)(record)
    return ancestor && Node.getNodeDefUuid(ancestor) === pageNodeDefUuid
  })
}

/**
 * Whether a node belongs to this page only — not to a nested descendant page entity.
 * Used so expanded parents do not inherit child-page errors/completion.
 */
const nodeBelongsToOwnPage = (
  node: object,
  pageNodeDefUuid: string,
  descendantPageUuids: string[],
  record: RecordType
) => {
  if (!nodeBelongsToPage(node, pageNodeDefUuid, record)) return false
  if (descendantPageUuids.includes(Node.getNodeDefUuid(node))) return false
  return !descendantPageUuids.some((descendantUuid) => nodeBelongsToPage(node, descendantUuid, record))
}

const getPageValidation = ({
  pageNodeDefUuid,
  descendantPageUuids,
  record,
}: {
  pageNodeDefUuid: string
  descendantPageUuids: string[]
  record: RecordType
}) => {
  const recordValidation = Record.getValidation(record)
  const fields = Validation.getFieldValidations(recordValidation)
  let hasErrors = false
  let hasWarnings = false
  for (const nodeUuid of Object.keys(fields)) {
    const node = Record.getNodeByUuid(nodeUuid)(record)
    if (!node) continue
    if (!nodeBelongsToOwnPage(node, pageNodeDefUuid, descendantPageUuids, record)) continue
    const nodeValidation = RecordValidation.getNodeValidation(node)(recordValidation)
    if (!nodeValidation) continue
    if (Validation.isError(nodeValidation)) hasErrors = true
    if (Validation.isWarning(nodeValidation)) hasWarnings = true
    if (hasErrors && hasWarnings) break
  }
  return { hasErrors, hasWarnings }
}

type GetEntityCompletionPercent = (params: { survey: unknown; record: unknown; entity: unknown }) => number

/**
 * Resolves the page entity node without requiring the page to have been visited
 * (pagesUuidMap may be empty until the user opens that page).
 */
const getPageEntity = (pageNodeDefUuid: string, state: unknown) => {
  const record = RecordState.getRecord(state)
  if (!record) return null

  const pagesUuidMap = SurveyFormState.getPagesUuidMap(state)
  const mappedUuid = pagesUuidMap?.[pageNodeDefUuid]
  if (mappedUuid) {
    const mappedEntity = Record.getNodeByUuid(mappedUuid)(record)
    if (mappedEntity) return mappedEntity
  }

  // Prefer a child under a known parent page entity when the page itself is unmapped.
  const survey = SurveyState.getSurvey(state)
  const pageNodeDef = Survey.getNodeDefByUuid(pageNodeDefUuid)(survey)
  const parentDefUuid = pageNodeDef ? NodeDef.getParentUuid(pageNodeDef) : null
  if (parentDefUuid) {
    const parentMappedUuid = pagesUuidMap?.[parentDefUuid]
    const parentEntity = parentMappedUuid
      ? Record.getNodeByUuid(parentMappedUuid)(record)
      : Record.getNodesByDefUuid(parentDefUuid)(record)?.[0]
    if (parentEntity) {
      const children = Record.getNodeChildrenByDefUuid(parentEntity, pageNodeDefUuid)(record)
      if (children?.[0]) return children[0]
    }
  }

  const nodesByDef = Record.getNodesByDefUuid(pageNodeDefUuid)(record)
  return nodesByDef?.[0] ?? null
}

/**
 * Whether the page entity definition has any own (non-nested-entity) attributes that
 * count toward completion. Matches arena-core empty-stats → 100% behavior.
 */
const pageHasOwnCompletableAttributes = (pageNodeDefUuid: string, state: unknown): boolean => {
  const survey = SurveyState.getSurvey(state)
  const pageNodeDef = Survey.getNodeDefByUuid(pageNodeDefUuid)(survey)
  if (!pageNodeDef) return false
  const childDefs = Survey.getNodeDefChildren({ nodeDef: pageNodeDef })(survey)
  return childDefs.some((childDef) => {
    if (NodeDef.isEntity(childDef)) return false
    return NodeDef.isKey(childDef) || NodeDefValidations.isRequired(NodeDef.getValidations(childDef))
  })
}

const getPageCompletionPercent = ({
  pageNodeDefUuid,
  ownOnly,
  state,
}: {
  pageNodeDefUuid: string
  ownOnly: boolean
  state: unknown
}): number | null => {
  const record = RecordState.getRecord(state)
  if (!record) return null

  const recordsApi = Records as Record<string, unknown>
  const preferred = ownOnly ? recordsApi.getEntityOwnCompletionPercent : recordsApi.getEntityCompletionPercent
  const completionFn = (typeof preferred === 'function' ? preferred : recordsApi.getEntityCompletionPercent) as
    | GetEntityCompletionPercent
    | undefined
  if (typeof completionFn !== 'function') return null

  const entity = getPageEntity(pageNodeDefUuid, state)
  if (!entity) {
    // Unvisited pages with no own required/key attributes are complete (arena-core returns 100
    // when total === 0). Pages with completable attributes stay incomplete until the entity exists.
    if (ownOnly && !pageHasOwnCompletableAttributes(pageNodeDefUuid, state)) return 100
    return null
  }

  const survey = SurveyState.getSurvey(state)
  return completionFn({ survey, record, entity })
}

/**
 * Returns status for a sidebar tree page item. When the item is expanded,
 * only that page's own fields are considered (nested page entities excluded).
 * When collapsed, status rolls up across the page and all descendant pages,
 * each evaluated with its own-page scope.
 *
 * @param pageNodeDefUuid - UUID of this tree item's page node def
 * @param descendantPageUuids - Page node def UUIDs under this item in the tree
 * @param descendantPageUuidsByPage - Per-page descendant lists for the subtree
 * @param isTreeItemExpanded - Whether this tree item is currently expanded
 * @returns Aggregated error/warning/complete flags
 */
export const useRecordTreeItemStatus = ({
  pageNodeDefUuid,
  descendantPageUuids,
  descendantPageUuidsByPage,
  isTreeItemExpanded,
}: Params): TreeItemStatus => {
  return useSelector((state): TreeItemStatus => {
    const record = RecordState.getRecord(state)
    if (!record) return { hasErrors: false, hasWarnings: false, isComplete: false }

    const evaluatePage = (uuid: string) => {
      const pageDescendants = descendantPageUuidsByPage[uuid] ?? []
      const { hasErrors, hasWarnings } = getPageValidation({
        pageNodeDefUuid: uuid,
        descendantPageUuids: pageDescendants,
        record,
      })
      const percent = getPageCompletionPercent({ pageNodeDefUuid: uuid, ownOnly: true, state })
      return { hasErrors, hasWarnings, isComplete: percent === 100 && !hasErrors && !hasWarnings }
    }

    if (isTreeItemExpanded) {
      return evaluatePage(pageNodeDefUuid)
    }

    const scopedUuids = [pageNodeDefUuid, ...descendantPageUuids]
    let hasErrors = false
    let hasWarnings = false
    let allComplete = scopedUuids.length > 0

    for (const uuid of scopedUuids) {
      const status = evaluatePage(uuid)
      if (status.hasErrors) hasErrors = true
      if (status.hasWarnings) hasWarnings = true
      if (!status.isComplete) allComplete = false
    }

    return {
      hasErrors,
      hasWarnings,
      isComplete: allComplete && !hasErrors && !hasWarnings,
    }
  }, Objects.isEqual)
}
