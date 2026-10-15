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
import type { ChangeSet, ConflictReason, NodeDefOperation, OperationConflict } from './types'

type KeyedMessage = { key: string; params: Record<string, unknown> }

const EXPRESSION_INVALID_KEY = 'aiAssistant.issues.expressionInvalid'
const NODE_DEF_INVALID_KEY = 'aiAssistant.issues.nodeDefInvalid'

// the checks of the preview build messages with a translator: this one keeps the key and its params instead
const keepKey = (key: string, params: Record<string, unknown> = {}): string => JSON.stringify({ key, params })

// a message that is not a kept key is the raw text of an expression parser error
const readKeyedMessage = (message: string): KeyedMessage => {
  const start = message.indexOf('{"key"')
  if (start >= 0) {
    try {
      const { key, params } = JSON.parse(message.slice(start))
      if (typeof key === 'string') return { key, params: params ?? {} }
    } catch {
      // not a kept key
    }
  }
  return { key: EXPRESSION_INVALID_KEY, params: { text: message } }
}

const toConflict = (id: string, { key, params }: KeyedMessage): OperationConflict => ({
  id,
  reason: key as ConflictReason,
  params,
})

/**
 * Returns the operations the rules are checked on: those to check, plus (unless `onlySelected`) the creates that are
 * not in the survey yet, in proposal order. Creates already in the survey were applied.
 * @param {ChangeSet} changeSet - Change set.
 * @param {object} survey - Current survey.
 * @param {string[]} [operationIds] - Operations to check (default: all).
 * @param {boolean} [onlySelected] - Leave out the creates that are not selected (they will not be applied).
 * @returns {NodeDefOperation[]} The operations.
 */
const selectOperations = (
  changeSet: ChangeSet,
  survey: any,
  operationIds?: string[],
  onlySelected = false
): NodeDefOperation[] =>
  changeSet.operations.filter((op): op is NodeDefOperation => {
    if (isRecordEditOperation(op) || isCategoryItemLabelOperation(op)) return false
    if (operationIds?.includes(op.id) ?? true) return true
    return (
      !onlySelected && op.type === 'nodeDef.create' && !Survey.getNodeDefByUuid(NodeDef.getUuid(op.nodeDef))(survey)
    )
  })

/**
 * Returns the operations that break a structural rule of the designer on the current survey (category and taxonomy of
 * a published attribute, multiple, key, parent of a new item, languages), checking them in order as they would be
 * applied. Synchronous, so a card can use it to show itself as stale.
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - Change set.
 * @param {object} params.survey - Current survey.
 * @param {string[]} [params.operationIds] - Operations to report and check (default: all).
 * @returns {OperationConflict[]} One conflict per operation that breaks a rule: reason = the i18n key of the issue
 * (`aiAssistant.issues.*`), params = its interpolation values.
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
  const { issues } = applyOperations({ ...changeSet, operations }, survey, keepKey)
  const seen = new Set<string>()
  const conflicts: OperationConflict[] = []
  for (const { operation, message } of issues) {
    const { id } = operations[operation]
    if (seen.has(id) || (operationIds && !operationIds.includes(id))) continue
    seen.add(id)
    conflicts.push(toConflict(id, readKeyedMessage(message)))
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
 * @returns {Promise<OperationConflict[]>} The conflicts: every operation on an invalid node definition, reason
 * `aiAssistant.issues.nodeDefInvalid`, params `{ name, count, issues: [{ key, params }] }`.
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
  // a create that is not selected will not be saved: what depends on it is invalid
  const operations = selectOperations(changeSet, survey, operationIds, true)
  const subset = { ...changeSet, operations }
  const { draft, firstOperationByUuid } = applyOperations(subset, survey, keepKey)
  const issues = [
    ...(await validateTouchedNodeDefs(draft, firstOperationByUuid, keepKey)),
    ...(await checkOtherExpressions(subset, draft, keepKey)),
  ]
  // a node definition is saved whole: every selected operation on an invalid one is held back, with all its issues
  const issuesByUuid = new Map<string, KeyedMessage[]>()
  for (const { operation, message } of issues) {
    const uuid = getOperationNodeDefUuid(operations[operation])
    const list = issuesByUuid.get(uuid) ?? []
    const keyed = readKeyedMessage(message)
    if (!list.some((other) => JSON.stringify(other) === JSON.stringify(keyed))) list.push(keyed)
    issuesByUuid.set(uuid, list)
  }
  return operations
    .filter((op) => issuesByUuid.has(getOperationNodeDefUuid(op)))
    .map((op) => {
      const uuid = getOperationNodeDefUuid(op)
      const nodeDefIssues = issuesByUuid.get(uuid) as KeyedMessage[]
      const nodeDef = Survey.getNodeDefByUuid(uuid)(draft)
      const name = nodeDef ? NodeDef.getName(nodeDef) : ''
      return toConflict(op.id, {
        key: NODE_DEF_INVALID_KEY,
        params: { name, count: nodeDefIssues.length, issues: nodeDefIssues },
      })
    })
}
