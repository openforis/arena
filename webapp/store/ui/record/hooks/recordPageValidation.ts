import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'

type RecordType = NonNullable<ReturnType<typeof RecordState.getRecord>>
type SurveyType = ReturnType<typeof SurveyState.getSurvey>

/**
 * Whether a node belongs under a page entity (itself or any descendant of that page).
 *
 * @param node - Record node
 * @param pageNodeDefUuid - Page entity node def UUID
 * @param record - Record
 * @returns True when the node is in the page's hierarchy
 */
export const nodeBelongsToPage = (node: object, pageNodeDefUuid: string, record: RecordType): boolean => {
  if (Node.getNodeDefUuid(node) === pageNodeDefUuid) return true
  return Node.getHierarchy(node).some((ancestorUuid: string) => {
    const ancestor = Record.getNodeByUuid(ancestorUuid)(record)
    return Boolean(ancestor && Node.getNodeDefUuid(ancestor) === pageNodeDefUuid)
  })
}

/**
 * Whether a node belongs to this page only — not to a nested descendant page entity.
 *
 * @param node - Record node
 * @param pageNodeDefUuid - Page entity node def UUID
 * @param descendantPageUuids - Descendant page node def UUIDs
 * @param record - Record
 * @returns True when the node is in this page's own field scope
 */
export const nodeBelongsToOwnPage = (
  node: object,
  pageNodeDefUuid: string,
  descendantPageUuids: string[],
  record: RecordType
): boolean => {
  if (!nodeBelongsToPage(node, pageNodeDefUuid, record)) return false
  if (descendantPageUuids.includes(Node.getNodeDefUuid(node))) return false
  return !descendantPageUuids.some((descendantUuid) => nodeBelongsToPage(node, descendantUuid, record))
}

/**
 * Collects all page-entity node defs in the survey cycle (root + nested own-pages).
 *
 * @param survey - Survey
 * @param cycle - Survey cycle key
 * @returns Page entity node defs
 */
export const collectPageNodeDefs = (survey: SurveyType, cycle: string): object[] => {
  const root = Survey.getNodeDefRoot(survey)
  if (!root) return []

  const pages: object[] = []
  const stack: object[] = [root]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue
    pages.push(current)
    const children = Survey.getNodeDefChildrenInOwnPage({ nodeDef: current, cycle })(survey)
    stack.push(...children)
  }
  return pages
}

/**
 * Collects descendant page node def UUIDs under a page (not including the page itself).
 *
 * @param survey - Survey
 * @param cycle - Survey cycle key
 * @param pageNodeDef - Page entity node def
 * @returns Descendant page UUIDs
 */
export const collectDescendantPageUuids = (survey: SurveyType, cycle: string, pageNodeDef: object): string[] => {
  const uuids: string[] = []
  const visit = (nodeDef: object) => {
    const children = Survey.getNodeDefChildrenInOwnPage({ nodeDef, cycle })(survey)
    for (const child of children) {
      uuids.push(NodeDef.getUuid(child))
      visit(child)
    }
  }
  visit(pageNodeDef)
  return uuids
}

/**
 * Returns whether the page has validation errors on its own fields
 * (excluding nested page entities).
 *
 * @param params - Page scope and record
 * @returns True when the page has own-field errors
 */
export const pageHasOwnErrors = ({
  pageNodeDefUuid,
  descendantPageUuids,
  record,
}: {
  pageNodeDefUuid: string
  descendantPageUuids: string[]
  record: RecordType
}): boolean => {
  const recordValidation = Record.getValidation(record)
  const fields = Validation.getFieldValidations(recordValidation)

  for (const nodeUuid of Object.keys(fields)) {
    const node = Record.getNodeByUuid(nodeUuid)(record)
    if (!node) continue
    if (!nodeBelongsToOwnPage(node, pageNodeDefUuid, descendantPageUuids, record)) continue
    const nodeValidation = RecordValidation.getNodeValidation(node)(recordValidation)
    if (nodeValidation && Validation.isError(nodeValidation)) return true
  }
  return false
}
