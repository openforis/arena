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

    const nodesToUpdate = R.pipe(
      R.filter(
        n => {
          const nodeUuid = Node.getUuid(n)
          const nodeExisting = RecordReader.getNodeByUuid(nodeUuid)(record)

          return !nodeExisting || //new node
            !Node.isDirty(nodeExisting) || //existing node is not dirty
            Node.isDirty(n) || //new node is dirty, replace the existing one
            R.equals(Node.getValue(nodeExisting), Node.getValue(n)) || //new node is not dirty and has the same value of the existing (dirty) node
            Node.isValueBlank(nodeExisting) && Node.isDefaultValueApplied(n) //existing node has a blank value and n has a default value applied
        }
      ),
      R.map(
        R.omit([Node.keys.updated, Node.keys.created]) //exclude updated and created properties (used by Survey RDB generation)
      )
    )(nodes)

    const nodesDeletedArray = R.pipe(
      R.filter(Node.isDeleted),
      R.values
    )(nodes)

    const recordUpdated = {
      ...record,
      [keys.nodes]: {
        ...RecordReader.getNodes(record),
        ...nodesToUpdate
      }
    }

    return R.pipe(
      deleteNodes(nodesDeletedArray),
      NodesIndex.addNodes(nodesToUpdate)
    )(recordUpdated)
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
    delete recordUpdated[keys.nodes][nodeUuid]

    return recordUpdated
  }

module.exports = {
  assocNodes,
  assocNode,

  deleteNode,
}