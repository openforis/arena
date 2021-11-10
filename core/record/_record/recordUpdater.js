import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'

import { keys } from './recordKeys'
import * as NodesIndex from './recordNodesIndex'
import * as RecordReader from './recordReader'

// ====== UPDATE

export const mergeNodes = (nodes) => (record) => {
  let recordUpdated = { ...record }
  if (!(keys.nodes in recordUpdated)) {
    recordUpdated[keys.nodes] = {}
  }

  R.forEachObjIndexed((n, nodeUuid) => {
    // Remove deleted node
    if (Node.isDeleted(n)) {
      recordUpdated = deleteNode(n)(recordUpdated)
    } else {
      const nodeExisting = RecordReader.getNodeByUuid(nodeUuid)(recordUpdated)
      // Exclude dirty nodes currently being edited by the user
      const includes =
        !nodeExisting || // NodeExisting does not exist, n is new node
        !Node.isDirty(nodeExisting) || // Existing node is not dirty
        Node.isDirty(n) || // New node is dirty, replace the existing one
        R.equals(Node.getValue(nodeExisting), Node.getValue(n)) || // New node is not dirty and has the same value of the existing (dirty) node
        (Node.isValueBlank(nodeExisting) && Node.isDefaultValueApplied(n)) // Existing node has a blank value and n has a default value applied

      if (includes) {
        const nodeUpdated = R.omit([Node.keys.updated, Node.keys.created], n) // Exclude updated and created properties (used by Survey RDB generation)
        recordUpdated[keys.nodes][nodeUuid] = nodeUpdated
        recordUpdated = NodesIndex.addNode(nodeUpdated)(recordUpdated)
      }
    }
  }, nodes)

  return recordUpdated
}

export const assocNodes = (nodes) => (record) => {
  let recordUpdated = { ...record }
  recordUpdated[keys.nodes] = { ...RecordReader.getNodes(record) }

  Object.entries(nodes).forEach(([nodeUuid, node]) => {
    if (Node.isDeleted(node)) {
      recordUpdated = deleteNode(node)(recordUpdated)
    } else {
      recordUpdated[keys.nodes][nodeUuid] = node
      recordUpdated = NodesIndex.addNode(node)(recordUpdated)
    }
  })

  return recordUpdated
}

export const assocNode = (node) => assocNodes({ [Node.getUuid(node)]: node })

export const mergeNodeValidations = (nodeValidations) => (record) =>
  R.pipe(Validation.getValidation, Validation.mergeValidation(nodeValidations), (validationMerged) =>
    Validation.assocValidation(validationMerged)(record)
  )(record)

// ====== DELETE

export const deleteNode = (node) => (record) => {
  const nodeUuid = Node.getUuid(node)

  // 1. remove entity children recursively
  const children = RecordReader.getNodeChildren(node)(record)

  // 2. remove node from index
  let recordUpdated = NodesIndex.removeNode(node)(record)

  // 3. delete children
  recordUpdated = R.reduce((recordAcc, child) => deleteNode(child)(recordAcc), record, children)

  // 4. update validation
  recordUpdated = R.pipe(
    Validation.getValidation,
    Validation.dissocFieldValidation(nodeUuid),
    // Dissoc childrenCount validation
    Validation.dissocFieldValidationsStartingWith(`${RecordValidation.prefixValidationFieldChildrenCount}${nodeUuid}`),
    (newValidation) => Validation.assocValidation(newValidation)(recordUpdated)
  )(recordUpdated)

  // 5. remove node from record
  delete recordUpdated[keys.nodes][nodeUuid]

  return recordUpdated
}
