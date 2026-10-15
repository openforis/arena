/**
 * The form designer's guards, run again on the current survey when a card is shown or applied: a card proposed
 * before the survey was published, or before another edit, may now break a rule that the proposal respected.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { getOperationNodeDefUuid } from './operations'
import { applyOperations, checkOtherExpressions, validateTouchedNodeDefs } from './previewChangeSet'
import { isRecordEditOperation } from './recordEdits/types'
import { isCategoryItemLabelOperation } from './categoryItemLabels/types'
import type { ChangeSet, NodeDefOperation, OperationConflict } from './types'

const ISSUE_KEY_PREFIX = 'aiAssistant.issues.'

// the reason of a conflict is the key of the broken rule, not a sentence in some language
const keyTranslator = (key: string): string =>
  key.startsWith(ISSUE_KEY_PREFIX) ? key.slice(ISSUE_KEY_PREFIX.length) : key

const toConflict = (id: string, rule: string): OperationConflict => ({ id, reason: `designerRule:${rule}` })

/**
 * Returns the operations the rules are checked on: those to check, plus the creates that are not in the survey yet
 * (a checked operation may need them), in proposal order. Creates already in the survey were applied.
 * @param {ChangeSet} changeSet - Change set.
 * @param {object} survey - Current survey.
 * @param {string[]} [operationIds] - Operations to check (default: all).
 * @returns {NodeDefOperation[]} The operations.
 */
const selectOperations = (changeSet: ChangeSet, survey: any, operationIds?: string[]): NodeDefOperation[] =>
  changeSet.operations.filter((op): op is NodeDefOperation => {
    if (isRecordEditOperation(op) || isCategoryItemLabelOperation(op)) return false
    if (operationIds?.includes(op.id) ?? true) return true
    return op.type === 'nodeDef.create' && !Survey.getNodeDefByUuid(NodeDef.getUuid(op.nodeDef))(survey)
  })

/**
 * Returns the operations that break a structural rule of the designer on the current survey (category and taxonomy of
 * a published attribute, multiple, key, parent of a new item, languages), checking them in order as they would be
 * applied. Synchronous, so a card can use it to show itself as stale.
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - Change set.
 * @param {object} params.survey - Current survey.
 * @param {string[]} [params.operationIds] - Operations to report and check (default: all).
 * @returns {OperationConflict[]} One conflict per operation that breaks a rule, reason `designerRule:<issue key>`.
 */
export const findStructuralConflicts = ({
  changeSet,
  survey,
  operationIds,
}: {
  changeSet: ChangeSet
  survey: any
  operationIds?: string[]
}): OperationConflict[] => {
  const operations = selectOperations(changeSet, survey, operationIds)
  const { issues } = applyOperations({ ...changeSet, operations }, survey, keyTranslator)
  const seen = new Set<string>()
  const conflicts: OperationConflict[] = []
  for (const { operation, message } of issues) {
    const { id } = operations[operation]
    if (seen.has(id) || (operationIds && !operationIds.includes(id))) continue
    seen.add(id)
    conflicts.push(toConflict(id, message))
  }
  return conflicts
}

/**
 * Returns the operations whose node definition would not pass the designer's validation (a deleted attribute in an
 * expression, a missing category, a duplicate name...) once the operations are applied. Asynchronous: Apply runs it
 * after the structural check, on the operations it is about to save.
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - Change set.
 * @param {object} params.survey - Current survey.
 * @param {string[]} params.operationIds - Operations about to be applied.
 * @returns {Promise<OperationConflict[]>} The conflicts: every operation on an invalid node definition.
 */
export const findValidationConflicts = async ({
  changeSet,
  survey,
  operationIds,
}: {
  changeSet: ChangeSet
  survey: any
  operationIds: string[]
}): Promise<OperationConflict[]> => {
  const operations = selectOperations(changeSet, survey, operationIds)
  const subset = { ...changeSet, operations }
  const { draft, firstOperationByUuid } = applyOperations(subset, survey, keyTranslator)
  const issues = [
    ...(await validateTouchedNodeDefs(draft, firstOperationByUuid, keyTranslator)),
    ...(await checkOtherExpressions(subset, draft, keyTranslator)),
  ]
  // a node definition is saved whole: every selected operation on an invalid one is held back
  const invalidUuids = new Map<string, string>()
  for (const { operation, message } of issues) {
    const uuid = getOperationNodeDefUuid(operations[operation])
    if (!invalidUuids.has(uuid)) invalidUuids.set(uuid, message)
  }
  return operations
    .filter((op) => operationIds.includes(op.id) && invalidUuids.has(getOperationNodeDefUuid(op)))
    .map((op) => toConflict(op.id, invalidUuids.get(getOperationNodeDefUuid(op)) as string))
}
