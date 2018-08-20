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

const eventType = {
  recordCreated: 'recordCreated',
  recordDeleted: 'recordDeleted',
  stepChanged: 'stepChanged',
  nodeAdded: 'nodeAdded',
  nodeUpdated: 'nodeUpdated',
  nodeDeleted: 'nodeDeleted',
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
  R.find(n => n.id === id),
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

const createRootNode = (recordId, rootNodeDefId) => createNode(recordId, null, rootNodeDefId)

module.exports = {
  commandType,
  eventType,
  recordLogType,
  createNode,
  createRootNode,
  getNode,
  getNodeChildren,
  getNodes,
  getNodesArray,
  getNodesByParentId,
  getRootNode,
}