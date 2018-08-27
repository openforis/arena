const R = require('ramda')

const nodes = 'nodes'

const commandType = {
  createRecord: 'createRecord',
  deleteRecord: 'deleteRecord',
  changeStep: 'changeStep',
  addNode: 'addNode',
  deleteNode: 'deleteNode',
  updateNode: 'updateNode',
}

const recordLogType = {
  recordCreated: 'recordCreated',
  recordDeleted: 'recordDeleted',
  stepChanged: 'stepChanged',
  nodeAdded: 'nodeAdded',
  nodeUpdated: 'nodeUpdated',
  nodeDeleted: 'nodeDeleted',
}

const getNodes = R.pipe(
  R.prop(nodes),
  R.defaultTo({}),
)

const getNode = id => R.pipe(
  getNodes,
  R.prop(id),
)

const getNodesArray = R.pipe(
  getNodes,
  R.values,
)

const getNodesByParentId = parentId => R.pipe(
  getNodesArray,
  R.filter(n => n.parentId === parentId),
)

const getRootNode = R.pipe(
  getNodesByParentId(null),
  R.head,
)

const getNodeChildren = node => getNodesByParentId(node.id)

const createNode = (recordId, parentId, nodeDefId, value = null) => {
  return {
    recordId,
    parentId,
    nodeDefId,
    value
  }
}

const addNode = node => R.assocPath(['nodes', node.id], node)

const getNodeValue = node => R.pipe(
  R.prop('value'),
  R.defaultTo({})
)(node)

const deleteNodeAndChildren = node => record => {
  record.nodes = record.nodes.filter(n => n.id !== node.id && n.parentId !== node.id)
  return record
}

const updateNodes = nodes => record => {
  nodes.forEach(updatedNode => {
    const index = R.findIndex(existingNode => existingNode.id === updatedNode.id)(record.nodes)
    if (index >= 0) {
      record.nodes[index] = updatedNode
    } else {
      record.nodes.push(updatedNode)
    }
  })
  return record
}

module.exports = {
  commandType,
  recordLogType,
  createNode,
  getNode,
  getNodeChildren,
  getNodes,
  getNodesArray,
  getNodesByParentId,
  getRootNode,
  getNodeValue,
  deleteNodeAndChildren,
  updateNodes,
  addNode,
}