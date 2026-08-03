import { useSelector } from 'react-redux'

import { Objects, Records } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Record from '@core/record/record'

import { SurveyState } from '@webapp/store/survey'
import { SurveyFormState } from '@webapp/store/ui/surveyForm'
import * as SystemInfoState from '@webapp/store/system/info/state'
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

type GetEntityCompletionPercent = (params: { survey: unknown; record: unknown; entity: unknown }) => number

type PageEvalResult = {
  hasErrors: boolean
  hasWarnings: boolean
  hasCompletableContent: boolean
  isComplete: boolean
}

type EvaluatePageFn = (
  uuid: string,
  descendantPageUuidsByPage: Record<string, string[]>,
  record: object,
  state: unknown
) => PageEvalResult

const EMPTY_STATUS: TreeItemStatus = { hasErrors: false, hasWarnings: false, isComplete: false }

const EMPTY_PAGE_EVAL: PageEvalResult = {
  hasErrors: false,
  hasWarnings: false,
  hasCompletableContent: false,
  isComplete: false,
}

/**
 * Resolves the page entity node without requiring the page to have been visited
 * (pagesUuidMap may be empty until the user opens that page).
 * Falls back to the first record instance only for single entities — never for multiples.
 *
 * @param pageNodeDefUuid - Page entity node def UUID
 * @param state - Redux state
 * @returns Page entity node, or null when unresolved
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

  const survey = SurveyState.getSurvey(state)
  const pageNodeDef = Survey.getNodeDefByUuid(pageNodeDefUuid)(survey)
  if (!pageNodeDef) return null

  const parentDefUuid = NodeDef.getParentUuid(pageNodeDef)
  if (parentDefUuid) {
    return getPageEntityFromParent({ pageNodeDef, pageNodeDefUuid, parentDefUuid, pagesUuidMap, record, survey })
  }

  if (NodeDef.isMultiple(pageNodeDef)) return null
  return Record.getNodesByDefUuid(pageNodeDefUuid)(record)?.[0] ?? null
}

/**
 * Resolves a page entity via its parent entity in the record.
 *
 * @param params - Parent and page context
 * @returns Child page entity, or null
 */
const getPageEntityFromParent = ({
  pageNodeDef,
  pageNodeDefUuid,
  parentDefUuid,
  pagesUuidMap,
  record,
  survey,
}: {
  pageNodeDef: object
  pageNodeDefUuid: string
  parentDefUuid: string
  pagesUuidMap: Record<string, string> | undefined
  record: object
  survey: object
}) => {
  const parentDef = Survey.getNodeDefByUuid(parentDefUuid)(survey)
  const parentMappedUuid = pagesUuidMap?.[parentDefUuid]
  let parentEntity = parentMappedUuid ? Record.getNodeByUuid(parentMappedUuid)(record) : null
  // Only guess first parent instance when the parent is single.
  if (!parentEntity && parentDef && !NodeDef.isMultiple(parentDef)) {
    parentEntity = Record.getNodesByDefUuid(parentDefUuid)(record)?.[0] ?? null
  }
  if (!parentEntity) return null

  const children = Record.getNodeChildrenByDefUuid(parentEntity, pageNodeDefUuid)(record)
  // Multiple page entities under a parent must be selected via pagesUuidMap.
  if (NodeDef.isMultiple(pageNodeDef)) return null
  return children?.[0] ?? null
}

/**
 * Whether the page entity definition has any own (non-nested-entity) attributes that
 * count toward completion. Matches arena-core empty-stats → 100% behavior.
 *
 * @param pageNodeDefUuid - Page entity node def UUID
 * @param state - Redux state
 * @returns True when the page has own key/required attributes
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

/**
 * Returns own-page completion percent for a page entity, or null when unavailable.
 *
 * @param params - Page scope and Redux state
 * @returns Completion percent, or null
 */
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
 * True when entity is unresolved because a multiple ancestor lacks a pagesUuidMap entry.
 *
 * @param pageNodeDef - Page node def
 * @param survey - Survey
 * @param pagesUuidMap - Active page entity map
 * @returns True when scope cannot be resolved
 */
const hasUnresolvedMultipleAncestor = (
  pageNodeDef: object,
  survey: object,
  pagesUuidMap: Record<string, string> | undefined
): boolean => {
  let currentDef: object | null | undefined = pageNodeDef
  while (currentDef) {
    const parentDef = Survey.getNodeDefParent(currentDef)(survey)
    if (!parentDef) break
    if (NodeDef.isMultiple(parentDef)) {
      const parentDefUuid = NodeDef.getUuid(parentDef)
      if (!pagesUuidMap?.[parentDefUuid]) {
        return true
      }
    }
    currentDef = parentDef
  }
  return false
}

/**
 * Evaluates validation and completion for a single page with own-page scope (legacy).
 *
 * @param uuid - Page node def UUID
 * @param descendantPageUuidsByPage - Per-page descendant lists
 * @param record - Active record
 * @param state - Redux state
 * @returns Page evaluation flags
 */
const evaluatePage = (
  uuid: string,
  descendantPageUuidsByPage: Record<string, string[]>,
  record: object,
  state: unknown
): PageEvalResult => {
  const pageDescendants = descendantPageUuidsByPage[uuid] ?? []
  const { hasErrors, hasWarnings } = Records.getPageValidationStatus({
    pageNodeDefUuid: uuid,
    descendantPageUuids: pageDescendants,
    record,
  })
  const hasCompletableContent = pageHasOwnCompletableAttributes(uuid, state)
  const percent = getPageCompletionPercent({ pageNodeDefUuid: uuid, ownOnly: true, state })
  // Vacuous 100% (no own key/required fields) must not show a complete icon.
  const isComplete = hasCompletableContent && percent === 100 && !hasErrors && !hasWarnings
  return { hasErrors, hasWarnings, hasCompletableContent, isComplete }
}

/**
 * Evaluates validation and completion for a single page with instance scope (experimental).
 *
 * @param uuid - Page node def UUID
 * @param descendantPageUuidsByPage - Per-page descendant lists
 * @param record - Active record
 * @param state - Redux state
 * @returns Page evaluation flags
 */
const evaluatePageScoped = (
  uuid: string,
  descendantPageUuidsByPage: Record<string, string[]>,
  record: object,
  state: unknown
): PageEvalResult => {
  const survey = SurveyState.getSurvey(state)
  const pageNodeDef = Survey.getNodeDefByUuid(uuid)(survey)
  const entity = getPageEntity(uuid, state)

  if (!entity && pageNodeDef) {
    const parentDef = Survey.getNodeDefParent(pageNodeDef)(survey)
    if (parentDef && NodeDef.isMultiple(parentDef)) {
      return EMPTY_PAGE_EVAL
    }
    const pagesUuidMap = SurveyFormState.getPagesUuidMap(state)
    if (hasUnresolvedMultipleAncestor(pageNodeDef, survey, pagesUuidMap)) {
      return EMPTY_PAGE_EVAL
    }
  }

  const pageDescendants = descendantPageUuidsByPage[uuid] ?? []
  const scopeEntityUuid = entity?.uuid
  const { hasErrors, hasWarnings } = Records.getPageValidationStatus({
    pageNodeDefUuid: uuid,
    descendantPageUuids: pageDescendants,
    record,
    ...(scopeEntityUuid ? { scopeEntityUuid } : {}),
  })
  const hasCompletableContent = pageHasOwnCompletableAttributes(uuid, state)
  const percent = getPageCompletionPercent({ pageNodeDefUuid: uuid, ownOnly: true, state })
  const isComplete = hasCompletableContent && percent === 100 && !hasErrors && !hasWarnings
  return { hasErrors, hasWarnings, hasCompletableContent, isComplete }
}

/**
 * Rolls up status across a collapsed tree item and its descendant pages.
 *
 * @param scopedUuids - Page UUIDs in the collapsed subtree
 * @param descendantPageUuidsByPage - Per-page descendant lists
 * @param record - Active record
 * @param state - Redux state
 * @param evaluatePageFn - Page evaluator (legacy or scoped)
 * @returns Aggregated tree item status
 */
const rollupCollapsedStatus = (
  scopedUuids: string[],
  descendantPageUuidsByPage: Record<string, string[]>,
  record: object,
  state: unknown,
  evaluatePageFn: EvaluatePageFn = evaluatePage
): TreeItemStatus => {
  let hasErrors = false
  let hasWarnings = false
  let allCompletableComplete = true
  let anyCompletableContent = false

  for (const uuid of scopedUuids) {
    const status = evaluatePageFn(uuid, descendantPageUuidsByPage, record, state)
    if (status.hasErrors) hasErrors = true
    if (status.hasWarnings) hasWarnings = true
    // Empty/container pages stay out of the rollup complete check so they
    // neither show a lone check nor block a parent that has real fields.
    if (status.hasCompletableContent) {
      anyCompletableContent = true
      if (!status.isComplete) allCompletableComplete = false
    }
  }

  return {
    hasErrors,
    hasWarnings,
    isComplete: anyCompletableContent && allCompletableComplete && !hasErrors && !hasWarnings,
  }
}

/**
 * Legacy tree item status (record-wide validation, no instance scoping).
 *
 * @param state - Redux state
 * @param params - Tree item parameters
 * @returns Aggregated tree item status
 */
const legacyTreeItemStatus = (state: unknown, params: Params): TreeItemStatus => {
  const record = RecordState.getRecord(state)
  if (!record) return EMPTY_STATUS

  const { pageNodeDefUuid, descendantPageUuids, descendantPageUuidsByPage, isTreeItemExpanded } = params

  if (isTreeItemExpanded) {
    const { hasErrors, hasWarnings, isComplete } = evaluatePage(
      pageNodeDefUuid,
      descendantPageUuidsByPage,
      record,
      state
    )
    return { hasErrors, hasWarnings, isComplete }
  }

  return rollupCollapsedStatus([pageNodeDefUuid, ...descendantPageUuids], descendantPageUuidsByPage, record, state)
}

/**
 * Returns status for a sidebar tree page item. When the item is expanded,
 * only that page's own fields are considered (nested page entities excluded).
 * When collapsed, status rolls up across the page and all descendant pages,
 * each evaluated with its own-page scope.
 * Pages with no own key/required fields never get a complete icon (vacuous 100%
 * from arena-core is ignored for display); errors/warnings still surface.
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
    if (!record) return EMPTY_STATUS

    const experimentalFeatures = SystemInfoState.getConfigExperimentalFeatures(state)
    if (!experimentalFeatures) {
      return legacyTreeItemStatus(state, {
        pageNodeDefUuid,
        descendantPageUuids,
        descendantPageUuidsByPage,
        isTreeItemExpanded,
      })
    }

    const survey = SurveyState.getSurvey(state)
    const pageNodeDef = Survey.getNodeDefByUuid(pageNodeDefUuid)(survey)
    if (pageNodeDef && NodeDef.isMultiple(pageNodeDef)) {
      const status = Records.getMultiplePageEntitiesStatus({
        survey,
        record,
        pageNodeDefUuid,
        cycle: Record.getCycle(record),
      })
      return {
        hasErrors: status.hasErrors,
        hasWarnings: status.hasWarnings,
        isComplete: status.isComplete,
      }
    }

    if (isTreeItemExpanded) {
      const { hasErrors, hasWarnings, isComplete } = evaluatePageScoped(
        pageNodeDefUuid,
        descendantPageUuidsByPage,
        record,
        state
      )
      return { hasErrors, hasWarnings, isComplete }
    }

    return rollupCollapsedStatus(
      [pageNodeDefUuid, ...descendantPageUuids],
      descendantPageUuidsByPage,
      record,
      state,
      evaluatePageScoped
    )
  }, Objects.isEqual)
}
