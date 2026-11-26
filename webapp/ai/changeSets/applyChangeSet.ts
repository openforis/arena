/**
 * Applies the selected operations of a change set through the form designer's save path. Never called by a tool:
 * only the card's Apply button calls it.
 */
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { applyCategoryItemLabels, type CategoryLabelsApplierDeps } from './categoryItemLabels/applyCategoryItemLabels'
import { isCategoryItemLabelOperation } from './categoryItemLabels/types'
import { isDeepEqual } from './deepEqual'
import { findValidationConflicts } from './designerRuleConflicts'
import { findConflicts } from './findConflicts'
import { applyOperationToNodeDef, getOperationNodeDefUuid } from './operations'
import { isRecordEditOperation } from './recordEdits/types'
import { getRequestFailure } from './requestFailure'
import type { ChangeSet, NodeDefOperation, OperationConflict, OperationResult } from './types'

export type ApplierDeps = {
  getSurvey: () => any
  isSurveyDirty: () => boolean
  postNodeDef: (nodeDef: any) => Promise<void>
  putNodeDefProps: (params: {
    nodeDefUuid: string
    parentUuid: string
    props: Record<string, unknown>
    propsAdvanced: Record<string, unknown>
  }) => Promise<void>
  onNodeDefCreated: (nodeDef: any) => void
  onNodeDefUpdated: (nodeDef: any, prevNodeDef: any) => void
  onNodeDefSaved: (params: { nodeDef: any; nodeDefParent: any }) => void
  // category item labels (category item labels); without them, category operations are skipped (notSupported)
  categoryLabels?: CategoryLabelsApplierDeps
}

// message: the reason (an i18n key or a plain reason, see isI18nKeyReason); params: its interpolation values
const toConflictResult = ({ id, reason, params }: OperationConflict): OperationResult => ({
  id,
  status: 'conflict',
  message: reason,
  ...(params ? { params } : {}),
})

type Group = { uuid: string; operations: NodeDefOperation[] }

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

const groupByNodeDef = (operations: NodeDefOperation[]): Group[] => {
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
  message?: string,
  params?: Record<string, unknown>
) => {
  for (const op of group.operations) {
    results.set(op.id, message ? { id: op.id, status, message, ...(params ? { params } : {}) } : { id: op.id, status })
  }
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

// why the remaining groups must not be applied, or null
const getStopReason = (changeSet: ChangeSet, deps: ApplierDeps): string | null => {
  // another survey was opened meanwhile: the next saves would go to it
  if (Survey.getId(deps.getSurvey()) !== changeSet.surveyId) return 'surveyChanged'
  // the user edited the designer while a save was running
  if (deps.isSurveyDirty()) return 'surveyDirty'
  return null
}

// saves the group, then updates the store unless the survey changed or became dirty meanwhile (returned as stop reason)
const persistGroup = async (group: Group, changeSet: ChangeSet, deps: ApplierDeps): Promise<string | null> => {
  const [first, ...rest] = group.operations
  const isCreate = first.type === 'nodeDef.create'
  const before = isCreate ? null : Survey.getNodeDefByUuid(group.uuid)(deps.getSurvey())
  const base = first.type === 'nodeDef.create' ? NodeDef.dissocTemporary(first.nodeDef) : before
  const changes = isCreate ? rest : group.operations
  const nodeDef = changes.reduce((acc, op) => applyOperationToNodeDef(acc, op, deps.getSurvey()), base)
  if (isCreate) {
    await deps.postNodeDef(nodeDef)
  } else {
    const { props, propsAdvanced } = getChangedProps(before, nodeDef)
    await deps.putNodeDefProps({
      nodeDefUuid: group.uuid,
      parentUuid: NodeDef.getParentUuid(nodeDef),
      props,
      propsAdvanced,
    })
  }
  // the store dispatches below clear the dirty flag: they would hide the user's edit
  const stopReason = getStopReason(changeSet, deps)
  if (stopReason) return stopReason
  if (isCreate) deps.onNodeDefCreated(nodeDef)
  else deps.onNodeDefUpdated(nodeDef, before)
  deps.onNodeDefSaved({ nodeDef, nodeDefParent: Survey.getNodeDefParent(nodeDef)(deps.getSurvey()) })
  return null
}

/**
 * Applies the operations of one node definition, unless an earlier failure or stop skips them.
 * @param {object} params - Parameters.
 * @param {Group} params.group - Operations of the node definition.
 * @param {ApplierDeps} params.deps - Store access and save actions.
 * @param {Map} params.results - Results by operation.
 * @param {Set<string>} params.appliedCreates - Node definitions created so far.
 * @param {string|null} params.stopReason - Why the earlier groups stopped the run.
 * @returns {Promise<string|null>} The stop reason for the next groups.
 */
const applyGroup = async ({
  group,
  changeSet,
  deps,
  results,
  appliedCreates,
  stopReason,
}: {
  group: Group
  changeSet: ChangeSet
  deps: ApplierDeps
  results: Map<string, OperationResult>
  appliedCreates: Set<string>
  stopReason: string | null
}): Promise<string | null> => {
  const reason = stopReason ?? getStopReason(changeSet, deps)
  if (reason) {
    setGroupStatus(results, group, 'skipped', reason)
    return reason
  }
  if (dependsOnMissingCreate(group, deps.getSurvey(), appliedCreates, changeSet)) {
    setGroupStatus(results, group, 'skipped', 'dependencyNotApplied')
    return null
  }
  try {
    // saved on the server even when a stop reason comes back
    const nextReason = await persistGroup(group, changeSet, deps)
    if (group.operations[0].type === 'nodeDef.create') appliedCreates.add(group.uuid)
    setGroupStatus(results, group, 'applied')
    return nextReason
  } catch (error) {
    const { message, params } = getRequestFailure(error)
    setGroupStatus(results, group, 'failed', message, params)
    // later groups may reference it (e.g. an expression naming a definition whose create failed)
    return 'dependencyNotApplied'
  }
}

const applyGroups = async (
  groups: Group[],
  changeSet: ChangeSet,
  deps: ApplierDeps,
  results: Map<string, OperationResult>,
  onGroupDone: (group: Group) => void
) => {
  const appliedCreates = new Set<string>()
  let stopReason: string | null = null
  for (const group of groups) {
    // one save at a time, in proposal order: a group may depend on an earlier one (e.g. a created parent)
    stopReason = await applyGroup({ group, changeSet, deps, results, appliedCreates, stopReason }) // NOSONAR
    onGroupDone(group)
  }
}

/**
 * Applies the selected operations: refused while the designer has an unsaved edit, conflicts re-checked against
 * the latest survey, then one save per node definition, in proposal order, then one request for the category labels.
 * @param {object} params - Parameters.
 * @param {string[]} params.operationIds - Selected operations.
 * @param {ApplierDeps} params.deps - Store access and the designer's save actions.
 * @param {Function} [params.onProgress] - Operations done and total, after each save.
 * @returns {Promise<OperationResult[]>} One result per selected operation, in operation order.
 */
export const applyChangeSet = async ({
  changeSet,
  operationIds,
  deps,
  onProgress,
}: {
  changeSet: ChangeSet
  operationIds: string[]
  deps: ApplierDeps
  onProgress?: (done: number, total: number) => void
}): Promise<OperationResult[]> => {
  // the record-edit card has its own applier
  const selected = changeSet.operations.filter((op) => operationIds.includes(op.id) && !isRecordEditOperation(op))
  if (deps.isSurveyDirty()) return selected.map((op) => ({ id: op.id, status: 'skipped', message: 'surveyDirty' }))

  const results = new Map<string, OperationResult>()
  for (const conflict of findConflicts(changeSet, deps.getSurvey(), { operationIds })) {
    results.set(conflict.id, toConflictResult(conflict))
  }
  const toApply = selected.filter((op) => !results.has(op.id))
  // the designer's validation of what would be saved, on the survey as it is now
  const invalid = await findValidationConflicts({
    changeSet,
    survey: deps.getSurvey(),
    operationIds: toApply.filter((op) => !isCategoryItemLabelOperation(op)).map((op) => op.id),
  })
  for (const conflict of invalid) results.set(conflict.id, toConflictResult(conflict))
  // two filters: the first narrows the type to the node definition operations
  const nodeDefOperations = toApply
    .filter((op) => !isCategoryItemLabelOperation(op))
    .filter((op) => !results.has(op.id))
  const categoryLabelOperations = toApply.filter((op) => isCategoryItemLabelOperation(op))
  const total = nodeDefOperations.length + categoryLabelOperations.length
  let done = 0
  const advance = (count: number) => {
    done += count
    onProgress?.(done, total)
  }
  await applyGroups(groupByNodeDef(nodeDefOperations), changeSet, deps, results, (group) =>
    advance(group.operations.length)
  )
  await applyCategoryItemLabels({
    changeSet,
    operations: categoryLabelOperations,
    getSurvey: deps.getSurvey,
    deps: deps.categoryLabels,
    results,
    onChunkDone: advance,
  })
  return selected.map((op) => results.get(op.id) as OperationResult)
}
