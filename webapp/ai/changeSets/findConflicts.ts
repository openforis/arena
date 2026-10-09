/**
 * Compares a change set with the current draft survey: an operation whose `from` no longer matches is a conflict and
 * is never applied (the card shows it as stale).
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { isDeepEqual } from './deepEqual'
import { getOperationCurrentValue } from './operations'
import { isRecordEditOperation, type RecordAttributeUpdateOperation } from './recordEdits/types'
import type { ChangeOperation, ChangeSet, ConflictReason, NodeDefCreateOperation, OperationConflict } from './types'

const isNameTaken = (survey: any, name: unknown, ownUuid: string): boolean =>
  Survey.getNodeDefsArray(survey).some(
    (nodeDef: any) =>
      NodeDef.getName(nodeDef) === name && NodeDef.getUuid(nodeDef) !== ownUuid && !NodeDef.isDeleted(nodeDef)
  )

const checkCreate = (op: NodeDefCreateOperation, survey: any, createdUuids: Set<string>): ConflictReason | null => {
  const uuid = NodeDef.getUuid(op.nodeDef)
  if (Survey.getNodeDefByUuid(uuid)(survey)) return 'alreadyExists'
  if (!Survey.getNodeDefByUuid(op.parentUuid)(survey) && !createdUuids.has(op.parentUuid)) return 'parentMissing'
  if (isNameTaken(survey, NodeDef.getName(op.nodeDef), uuid)) return 'nameTaken'
  return null
}

const checkChange = (
  op: Exclude<ChangeOperation, NodeDefCreateOperation | RecordAttributeUpdateOperation>,
  survey: any,
  createdUuids: Set<string>
): ConflictReason | null => {
  const nodeDef = Survey.getNodeDefByUuid(op.nodeDefUuid)(survey)
  // a node definition this change set creates: nothing to compare yet
  if (!nodeDef) return createdUuids.has(op.nodeDefUuid) ? null : 'nodeDefMissing'
  if (!isDeepEqual(getOperationCurrentValue(nodeDef, op), op.from)) return 'valueChanged'
  if (op.type === 'nodeDef.update' && op.prop === 'name' && isNameTaken(survey, op.to, op.nodeDefUuid))
    return 'nameTaken'
  return null
}

/**
 * Returns the conflicts of a change set with the survey.
 * @param {ChangeSet} changeSet - Change set.
 * @param {object} survey - Current draft survey.
 * @param {object} [options] - Options.
 * @param {string[]} [options.operationIds] - Check only these operations (default: all).
 * @returns {OperationConflict[]} The conflicts, in operation order.
 */
export const findConflicts = (
  changeSet: ChangeSet,
  survey: any,
  { operationIds }: { operationIds?: string[] } = {}
): OperationConflict[] => {
  const createdUuids = new Set<string>()
  const conflicts: OperationConflict[] = []
  for (const op of changeSet.operations) {
    // record edits are checked by the server at Apply
    if (isRecordEditOperation(op)) continue
    const reason =
      op.type === 'nodeDef.create' ? checkCreate(op, survey, createdUuids) : checkChange(op, survey, createdUuids)
    if (op.type === 'nodeDef.create' && reason === null) createdUuids.add(NodeDef.getUuid(op.nodeDef))
    if (reason && (!operationIds || operationIds.includes(op.id))) conflicts.push({ id: op.id, reason })
  }
  return conflicts
}
