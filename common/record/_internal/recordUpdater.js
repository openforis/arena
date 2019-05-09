const R = require('ramda')

const Node = require('../node')
const Validator = require('../../validation/validator')

const keys = require('./recordKeys')
const NodesIndex = require('./recordNodesIndex')
const RecordReader = require('./recordReader')

// ====== UPDATE

const assocNodes = nodes =>
  record => {
    // exclude dirty nodes currently being edited by the user

    const dirtyNodes = NodesIndex.getNodesDirty(record)

    const nodesToUpdate = R.pipe(
      R.filter(
        n => {
          const dirtyNode = R.prop(Node.getUuid(n), dirtyNodes)
          return !dirtyNode ||
            Node.isDirty(n) ||
            R.equals(Node.getValue(dirtyNode), Node.getValue(n)) ||
            Node.isValueBlank(dirtyNode) && Node.isDefaultValueApplied(n)
        }),
      R.map(
        R.omit([Node.keys.updated, Node.keys.created])
      )
    )(nodes)

    const nodesDeletedArray = R.pipe(
      R.filter(Node.isDeleted),
      R.values
    )(nodes)

    return R.pipe(
      RecordReader.getNodes,
      R.mergeLeft(nodesToUpdate),
      mergedNodes => R.assoc(keys.nodes, mergedNodes)(record),
      deleteNodes(nodesDeletedArray),
      NodesIndex.addNodes(nodesToUpdate)
    )(record)
  }

const assocNode = node => assocNodes({ [Node.getUuid(node)]: node })

// ====== DELETE

const deleteNodes = nodesDeletedArray =>
  record => R.reduce(
    (updatedRecord, node) => deleteNode(node)(updatedRecord),
    record,
    nodesDeletedArray
  )

const deleteNode = node =>
  record => {
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
    recordUpdated = R.pipe(
      RecordReader.getNodes,
      R.dissoc(nodeUuid),
      newNodes => R.assoc(keys.nodes, newNodes, recordUpdated),
    )(recordUpdated)

    return recordUpdated
  }

module.exports = {
  assocNodes,
  assocNode,

  deleteNode,
}