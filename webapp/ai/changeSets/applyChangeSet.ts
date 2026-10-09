/**
 * Applies the selected operations of a change set through the form designer's save path. Never called by a tool:
 * only the card's Apply button calls it.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { isDeepEqual } from './deepEqual'
import { findConflicts } from './findConflicts'
import { applyOperationToNodeDef, getOperationNodeDefUuid } from './operations'
import type { ChangeOperation, ChangeSet, OperationResult } from './types'

export type ApplierDeps = {
  getSurvey: () => any
  getCycle: () => string
  isSurveyDirty: () => boolean
  postNodeDef: (nodeDef: any) => Promise<void>
  putNodeDefProps: (params: {
    nodeDefUuid: string
    parentUuid: string
    props: Record<string, unknown>
    propsAdvanced: Record<string, unknown>
  }) => Promise<void>
  onNodeDefCreated: (nodeDef: any) => void
  onNodeDefUpdated: (nodeDef: any) => void
  onNodeDefSaved: (params: { nodeDef: any; nodeDefParent: any }) => void
}

type Group = { uuid: string; operations: ChangeOperation[] }

const pickChanged = (before: Record<string, unknown> = {}, after: Record<string, unknown> = {}) => {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(after)) {
    if (!isDeepEqual(before[key], value)) result[key] = value
  }
  return result
}

/**
 * Returns the props and advanced props that changed, by top-level key (the server merges at the top level only).
 * @param {object} before - Node definition before.
 * @param {object} after - Node definition after.
 * @returns {{props: object, propsAdvanced: object}} The changed keys with their new values.
 */
export const getChangedProps = (before: any, after: any) => ({
  props: pickChanged(NodeDef.getProps(before), NodeDef.getProps(after)),
  propsAdvanced: pickChanged(NodeDef.getPropsAdvanced(before), NodeDef.getPropsAdvanced(after)),
})

const groupByNodeDef = (operations: ChangeOperation[]): Group[] => {
  const groups = new Map<string, Group>()
  for (const op of operations) {
    const uuid = getOperationNodeDefUuid(op)
    const group = groups.get(uuid) ?? { uuid, operations: [] }
    group.operations.push(op)
    groups.set(uuid, group)
  }
  return [...groups.values()]
}

const setGroupStatus = (
  results: Map<string, OperationResult>,
  group: Group,
  status: OperationResult['status'],
  message?: string
) => {
  for (const op of group.operations)
    results.set(op.id, message ? { id: op.id, status, message } : { id: op.id, status })
}

// a group depends on a create of the change set (its own definition or its parent) that did not run
const dependsOnMissingCreate = (
  group: Group,
  survey: any,
  appliedCreates: Set<string>,
  changeSet: ChangeSet
): boolean => {
  const createdInSet = (uuid: string) =>
    changeSet.operations.some((op) => op.type === 'nodeDef.create' && NodeDef.getUuid(op.nodeDef) === uuid)
  const [first] = group.operations
  const neededUuid = first.type === 'nodeDef.create' ? first.parentUuid : group.uuid
  if (Survey.getNodeDefByUuid(neededUuid)(survey) || appliedCreates.has(neededUuid)) return false
  return createdInSet(neededUuid)
}

const persistGroup = async (group: Group, deps: ApplierDeps): Promise<void> => {
  const [first, ...rest] = group.operations
  const isCreate = first.type === 'nodeDef.create'
  const before = isCreate ? null : Survey.getNodeDefByUuid(group.uuid)(deps.getSurvey())
  const base = first.type === 'nodeDef.create' ? NodeDef.dissocTemporary(first.nodeDef) : before
  const changes = isCreate ? rest : group.operations
  const nodeDef = changes.reduce((acc, op) => applyOperationToNodeDef(acc, op), base)
  if (isCreate) {
    await deps.postNodeDef(nodeDef)
    deps.onNodeDefCreated(nodeDef)
  } else {
    const { props, propsAdvanced } = getChangedProps(before, nodeDef)
    await deps.putNodeDefProps({
      nodeDefUuid: group.uuid,
      parentUuid: NodeDef.getParentUuid(nodeDef),
      props,
      propsAdvanced,
    })
    deps.onNodeDefUpdated(nodeDef)
  }
  deps.onNodeDefSaved({ nodeDef, nodeDefParent: Survey.getNodeDefParent(nodeDef)(deps.getSurvey()) })
}

const applyGroups = async (
  groups: Group[],
  changeSet: ChangeSet,
  deps: ApplierDeps,
  results: Map<string, OperationResult>
) => {
  const appliedCreates = new Set<string>()
  for (const group of groups) {
    if (dependsOnMissingCreate(group, deps.getSurvey(), appliedCreates, changeSet)) {
      setGroupStatus(results, group, 'skipped', 'dependencyNotApplied')
      continue
    }
    try {
      await persistGroup(group, deps)
      if (group.operations[0].type === 'nodeDef.create') appliedCreates.add(group.uuid)
      setGroupStatus(results, group, 'applied')
    } catch (error) {
      setGroupStatus(results, group, 'failed', error instanceof Error ? error.message : String(error))
    }
  }
}

/**
 * Applies the selected operations: refused while the designer has an unsaved edit, conflicts re-checked against
 * the latest survey, then one save per node definition, in proposal order.
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - Change set.
 * @param {string[]} params.operationIds - Selected operations.
 * @param {ApplierDeps} params.deps - Store access and the designer's save actions.
 * @returns {Promise<OperationResult[]>} One result per selected operation, in operation order.
 */
export const applyChangeSet = async ({
  changeSet,
  operationIds,
  deps,
}: {
  changeSet: ChangeSet
  operationIds: string[]
  deps: ApplierDeps
}): Promise<OperationResult[]> => {
  const selected = changeSet.operations.filter((op) => operationIds.includes(op.id))
  if (deps.isSurveyDirty()) return selected.map((op) => ({ id: op.id, status: 'skipped', message: 'surveyDirty' }))

  const results = new Map<string, OperationResult>()
  for (const { id, reason } of findConflicts(changeSet, deps.getSurvey(), { operationIds })) {
    results.set(id, { id, status: 'conflict', message: reason })
  }
  const toApply = selected.filter((op) => !results.has(op.id))
  await applyGroups(groupByNodeDef(toApply), changeSet, deps, results)
  return selected.map((op) => results.get(op.id) as OperationResult)
}
