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

module.exports = {
  commandType,
  eventType,
  recordLogType,
  createNode,
  getNode,
  getNodeChildren,
  getNodes,
  getNodesArray,
  getNodesByParentId,
  getRootNode,
  getNodeValue,

  addNode,
}