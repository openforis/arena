const R = require('ramda')

const Node = require('../node')
const Validator = require('../../validation/validator')

const keys = require('./recordKeys')
const NodesIndex = require('./recordNodesIndex')
const RecordReader = require('./recordReader')

// ====== UPDATE

const assocNodes = nodes => record => {
  let recordUpdated = { ...record }
  if (!recordUpdated[keys.nodes])
    recordUpdated[keys.nodes] = {}

  R.forEachObjIndexed((n, nodeUuid) => {

    // remove deleted node
    if (Node.isDeleted(n)) {
      recordUpdated = deleteNode(n)(recordUpdated)
    } else {
      const nodeExisting = RecordReader.getNodeByUuid(nodeUuid)(recordUpdated)
      // exclude dirty nodes currently being edited by the user
      const includes = !nodeExisting || // nodeExisting does not exist, n is new node
        !Node.isDirty(nodeExisting) || //existing node is not dirty
        Node.isDirty(n) || //new node is dirty, replace the existing one
        R.equals(Node.getValue(nodeExisting), Node.getValue(n)) || //new node is not dirty and has the same value of the existing (dirty) node
        Node.isValueBlank(nodeExisting) && Node.isDefaultValueApplied(n) //existing node has a blank value and n has a default value applied

      if (includes) {
        const nodeUpdated = R.omit([Node.keys.updated, Node.keys.created], n) //exclude updated and created properties (used by Survey RDB generation)
        recordUpdated[keys.nodes][nodeUuid] = nodeUpdated
        recordUpdated = NodesIndex.addNode(nodeUpdated)(recordUpdated)
      }

    }
  }, nodes)

  return recordUpdated
}

const assocNode = node => assocNodes({ [Node.getUuid(node)]: node })

const mergeNodeValidations = nodeValidations => record => R.pipe(
  Validator.getValidation,
  Validator.mergeValidation(nodeValidations),
  validationMerged => Validator.assocValidation(validationMerged)(record)
)(record)

// ====== DELETE

const deleteNode = node => record => {
  const nodeUuid = Node.getUuid(node)

  // 1. remove entity children recursively
  const children = RecordReader.getNodeChildren(node)(record)

  let recordUpdated = R.reduce(
    (recordAcc, child) => deleteNode(child)(recordAcc),
    record,
    children
  )

  // 2. update validation
  recordUpdated = R.pipe(
    Validator.getValidation,
    Validator.dissocFieldValidation(nodeUuid),
    newValidation => Validator.assocValidation(newValidation)(recordUpdated)
  )(recordUpdated)

  // 3. remove node from index
  recordUpdated = NodesIndex.removeNode(node)(recordUpdated)

  // 4. remove node from record
  delete recordUpdated[keys.nodes][nodeUuid]

  return recordUpdated
}

module.exports = {
  assocNodes,
  assocNode,
  mergeNodeValidations,

  deleteNode,
}