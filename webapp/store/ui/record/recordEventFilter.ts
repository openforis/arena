/**
 * Keeps the socket events of other records out of the open record (nodesUpdate / nodeValidationsUpdate).
 */
import * as Node from '@core/record/node'

import * as RecordState from './state'

type NodesByUuid = Record<string, any>

/**
 * Keeps the nodes of the given record (nodes without record uuid are kept: local updates).
 * @param {object} params - The parameters.
 * @param {NodesByUuid} params.nodes - The nodes by uuid.
 * @param {string|null} params.recordUuid - The open record uuid; null keeps every node.
 * @returns {NodesByUuid} The nodes of the record (the same object when nothing is filtered out).
 */
export const filterNodesOfRecord = ({
  nodes,
  recordUuid,
}: {
  nodes: NodesByUuid
  recordUuid: string | null
}): NodesByUuid => {
  if (!recordUuid || !nodes) return nodes
  const entries = Object.entries(nodes).filter(([, node]) => {
    const nodeRecordUuid = Node.getRecordUuid(node)
    return !nodeRecordUuid || nodeRecordUuid === recordUuid
  })
  return entries.length === Object.keys(nodes).length ? nodes : Object.fromEntries(entries)
}

/**
 * Reducer handler of nodesUpdate: merges only the nodes of the open record.
 * @param {object} sliceState - The ui.record slice.
 * @param {object} action - The action.
 * @param {NodesByUuid} action.nodes - The updated nodes.
 * @param {boolean} [action.removeDirtyFlag] - Whether to remove the dirty flag.
 * @returns {object} The new slice.
 */
export const mergeNodesOfOpenRecord = (
  sliceState: any,
  { nodes, removeDirtyFlag = true }: { nodes: NodesByUuid; removeDirtyFlag?: boolean }
): any => {
  const nodesOfRecord = filterNodesOfRecord({ nodes, recordUuid: RecordState.getRecordUuidInSlice(sliceState) })
  if (nodes && Object.keys(nodes).length > 0 && Object.keys(nodesOfRecord).length === 0) return sliceState
  return RecordState.mergeRecordNodes(nodesOfRecord, { removeDirtyFlag })(sliceState)
}

/**
 * Reducer handler of validationsUpdate: ignores the validations of another record.
 * @param {object} sliceState - The ui.record slice.
 * @param {object} action - The action.
 * @param {string} [action.recordUuid] - The record of the validations.
 * @param {object} action.validations - The node validations.
 * @returns {object} The new slice.
 */
export const mergeValidationsOfOpenRecord = (
  sliceState: any,
  { recordUuid, validations }: { recordUuid?: string; validations: any }
): any => {
  const openRecordUuid = RecordState.getRecordUuidInSlice(sliceState)
  if (openRecordUuid && recordUuid && recordUuid !== openRecordUuid) return sliceState
  return RecordState.mergeRecordNodeValidations(validations)(sliceState)
}

/**
 * Tells whether a socket event belongs to the open record (events without record uuid are accepted).
 * @param {object} params - The parameters.
 * @param {string} [params.recordUuid] - The record uuid carried by the event.
 * @param {string|null} [params.openRecordUuid] - The open record uuid.
 * @returns {boolean} True when the event can be applied to the open record.
 */
export const isEventOfOpenRecord = ({
  recordUuid,
  openRecordUuid,
}: {
  recordUuid?: string | null
  openRecordUuid?: string | null
}): boolean => !recordUuid || !openRecordUuid || recordUuid === openRecordUuid
