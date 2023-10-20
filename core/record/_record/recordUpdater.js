import * as R from 'ramda'

import { Records, Dates } from '@openforis/arena-core'

import * as Validation from '@core/validation/validation'
import * as Node from '@core/record/node'

import { keys } from './recordKeys'
import * as RecordReader from './recordReader'

// ====== UPDATE

/**
 * Updates the record nodes with the ones passed as parameter.
 * Existing nodes will be replaced by the ones in the specified parameter.
 * Nodes marked as "deleted" will be removed from the record.
 *
 * @param {object} nodes - The nodes to be added or updated.
 * @param {boolean} [removeFlags = false] - True if flags like "deleted" or "created" must be removed from the nodes, false otherwise.
 * @returns {object} - The updated record.
 */
export const mergeNodes =
  (nodes, removeFlags = false) =>
  (record) => {
    let recordUpdated = { ...record }
    if (!(keys.nodes in recordUpdated)) {
      recordUpdated[keys.nodes] = {}
    }

    Object.entries(nodes).forEach(([nodeUuid, n]) => {
      // Remove deleted node
      if (Node.isDeleted(n)) {
        recordUpdated = deleteNode(n)(recordUpdated)
      } else {
        const nodeExisting = RecordReader.getNodeByUuid(nodeUuid)(recordUpdated)
        // Exclude dirty nodes currently being edited by the user
        const toBeAdded =
          !nodeExisting || // NodeExisting does not exist, n is new node
          !Node.isDirty(nodeExisting) || // Existing node is not dirty
          Node.isDirty(n) || // New node is dirty, replace the existing one
          R.equals(Node.getValue(nodeExisting), Node.getValue(n)) || // New node is not dirty and has the same value of the existing (dirty) node
          (Node.isValueBlank(nodeExisting) && Node.isDefaultValueApplied(n)) // Existing node has a blank value and n has a default value applied

        if (toBeAdded) {
          // Remove "updated" and "created" flags (used by Survey RDB generation)
          const nodeUpdated = removeFlags ? R.omit([Node.keys.updated, Node.keys.created], n) : n
          recordUpdated = Records.addNode(nodeUpdated)(recordUpdated)
        }
      }
    })

    return recordUpdated
  }

export const assocNode =
  (node, { sideEffect = false } = {}) =>
  (record) => {
    if (Node.isDeleted(node)) {
      return deleteNode(node)(record)
    } else {
      return Records.addNode(node, { sideEffect })(record)
    }
  }

/**
 * Adds new nodes to the record.
 * Nodes shouldn't have been added previously to the record, so in this casa there is no need to check for duplicates.
 *
 * @param {!object} params - The parameters.
 * @param {!object} [params.nodes] - The nodes to be added.
 * @param {boolean} [params.updateNodesIndex = true] - True if the nodes must be added to the index (slower), false otherwise (faster).
 * @param {boolean} [params.sideEffect = true] - True if the passed record object can be modified by calling this function (faster), false otherwise.
 * @returns {object} - The updated record.
 */
export const assocNodes =
  ({ nodes, updateNodesIndex = true, sideEffect = false }) =>
  (record) =>
    Records.addNodes(nodes, { updateNodesIndex, sideEffect })(record)

export const mergeNodeValidations = (nodeValidations) => (record) =>
  R.pipe(Validation.getValidation, Validation.mergeValidation(nodeValidations), (validationMerged) =>
    Validation.assocValidation(validationMerged)(record)
  )(record)

export const dissocNodes = R.dissoc(keys.nodes)

export const assocDateModified = (dateModified) => (record) => {
  const dateModifiedString = Dates.formatForStorage(dateModified)
  return R.assoc(keys.dateModified, dateModifiedString)(record)
}

// ====== DELETE

export const deleteNode = (node) => (record) => {
  const nodeUuid = Node.getUuid(node)
  const { record: recordUpdated } = Records.deleteNode(nodeUuid)(record)
  return recordUpdated
}
