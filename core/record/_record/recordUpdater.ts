import { Records, Dates } from '@openforis/arena-core'
import type { ArenaRecord, ArenaRecordNode, ArenaRecordNodesMap, ArenaValidation } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as Validation from '@core/validation/validation'
import * as Node from '@core/record/node'

import { keys } from './recordKeys'
import * as RecordReader from './recordReader'

type RecordUpdater = (record: ArenaRecord) => ArenaRecord

// ====== UPDATE

type MergeNodesOptions = { removeFlags?: boolean; removeDirtyFlag?: boolean; sideEffect?: boolean }

// dirty nodes (currently being edited by the user) are replaced only in some cases
const isNodeToBeAdded = ({ nodeExisting, node }: { nodeExisting: ArenaRecordNode; node: ArenaRecordNode }): boolean =>
  !nodeExisting || // NodeExisting does not exist, node is new node
  !Node.isDirty(nodeExisting) || // Existing node is not dirty
  Node.isDirty(node) || // New node is dirty, replace the existing one
  A.equals(Node.getValue(nodeExisting), Node.getValue(node)) || // New node is not dirty and has the same value of the existing (dirty) node
  (Node.isValueBlank(nodeExisting) && Node.isDefaultValueApplied(node)) // Existing node has a blank value and node has a default value applied

/**
 * Updates the record nodes with the ones passed as parameter.
 * Existing nodes will be replaced by the ones in the specified parameter.
 * Nodes marked as "deleted" will be removed from the record.
 * @param nodes - The nodes to be added or updated.
 * @param options - The options.
 * @param options.removeFlags - True if flags like "deleted" or "created" must be removed from the nodes, false otherwise.
 * @param options.removeDirtyFlag - True if the "dirty" flag must be removed too (when removeFlags is true).
 * @param options.sideEffect - True if the passed record object can be modified (faster), false otherwise.
 * @returns Function returning the updated record.
 */
export const mergeNodes =
  (
    nodes: ArenaRecordNodesMap,
    { removeFlags = false, removeDirtyFlag = true, sideEffect = false }: MergeNodesOptions = {}
  ) =>
  (record: ArenaRecord): ArenaRecord => {
    let recordUpdated = sideEffect ? record : { ...record }
    if (!(keys.nodes in recordUpdated)) {
      recordUpdated[keys.nodes] = {}
    }

    for (const [nodeUuid, node] of Object.entries(nodes)) {
      if (Node.isDeleted(node)) {
        // Remove deleted node
        recordUpdated = deleteNode(node, { sideEffect })(recordUpdated)
      } else {
        const nodeExisting = RecordReader.getNodeByUuid(nodeUuid)(recordUpdated)
        if (isNodeToBeAdded({ nodeExisting, node })) {
          // Remove "updated" and "created" flags (used by Survey RDB generation)
          const nodeUpdated = removeFlags ? Node.removeFlags({ sideEffect, removeDirtyFlag })(node) : node
          recordUpdated = Records.addNode(nodeUpdated, { sideEffect })(recordUpdated)
        }
      }
    }
    return recordUpdated
  }

export const assocNode =
  (node: ArenaRecordNode, { sideEffect = false }: { sideEffect?: boolean } = {}): RecordUpdater =>
  (record) => {
    if (Node.isDeleted(node)) {
      return deleteNode(node)(record)
    }
    return Records.addNode(node, { sideEffect })(record)
  }

/**
 * Adds new nodes to the record.
 * Nodes shouldn't have been added previously to the record, so in this casa there is no need to check for duplicates.
 * @param params - The parameters.
 * @param params.nodes - The nodes to be added.
 * @param params.updateNodesIndex - True if the nodes must be added to the index (slower), false otherwise (faster).
 * @param params.sideEffect - True if the passed record object can be modified by calling this function (faster), false otherwise.
 * @returns Function returning the updated record.
 */
export const assocNodes =
  ({
    nodes,
    updateNodesIndex = true,
    sideEffect = false,
  }: {
    nodes: ArenaRecordNodesMap
    updateNodesIndex?: boolean
    sideEffect?: boolean
  }): RecordUpdater =>
  (record) =>
    Records.addNodes(nodes, { updateNodesIndex, sideEffect })(record)

/**
 * Replaces all the nodes of a record, building the nodes index from scratch.
 * Use it instead of assocNodes with nodes already in the record: in that case the index would not be stored,
 * and every following node update would rebuild it entirely.
 * @param nodes - The nodes (indexed by uuid).
 * @returns Function returning the updated record.
 */
export const replaceNodes =
  (nodes: ArenaRecordNodesMap): RecordUpdater =>
  (record) => {
    const recordWithoutNodes = { ...record }
    delete recordWithoutNodes[keys.nodes]
    delete recordWithoutNodes._nodesIndex
    return Records.addNodes(nodes, { sideEffect: true, sortNodes: true })(recordWithoutNodes)
  }

export const mergeNodeValidations =
  (nodeValidations: ArenaValidation): RecordUpdater =>
  (record) => {
    const validationMerged = Validation.mergeValidation(nodeValidations)(Validation.getValidation(record))
    // assocValidation is typed on plain objects
    return Validation.assocValidation(validationMerged)(record as unknown as Record<string, unknown>)
  }

export const dissocNodes: RecordUpdater = (record) => A.dissoc(keys.nodes, record)

export const assocDateModified =
  (dateModified: Date | string): RecordUpdater =>
  (record) => {
    const dateModifiedString = Dates.formatForStorage(dateModified)
    return A.assoc(keys.dateModified, dateModifiedString, record)
  }

// ====== DELETE

export const deleteNode =
  (node: ArenaRecordNode, { sideEffect = false }: { sideEffect?: boolean } = {}): RecordUpdater =>
  (record) => {
    const nodeUuid = Node.getUuid(node)
    const { record: recordUpdated } = Records.removeNode(nodeUuid, { sideEffect })(record)
    return recordUpdated
  }
