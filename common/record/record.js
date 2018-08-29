const R = require('ramda')
const {uuidv4} = require('./../uuid')

// ====== UTILS
const nodes = 'nodes'

// ====== CREATE

const newRecord = (user, surveyId, step) => {
  return {
    uuid: uuidv4(),
    surveyId,
    ownerId: user.id,
    step,
  }
}

const newNode = (nodeDefId, recordId, parentId = null) => {
  return {
    uuid: uuidv4(),
    nodeDefId,
    recordId,
    parentId,
  }
}

const addNode = node => R.assocPath(['nodes', node.id], node)

// ====== READ
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

const getNodesByDefId = nodeDefId => R.pipe(
  getNodesArray,
  R.filter(n => n.nodeDefId === nodeDefId),
)

const getRootNode = R.pipe(
  getNodesByParentId(null),
  R.head,
)

const getNodeChildren = node => getNodesByParentId(node.id)

const getNodeValue = (node, defaultValue = {}) => R.pipe(
  R.prop('value'),
  R.defaultTo(defaultValue)
)(node)

// ====== UPDATE

const assocNodes = nodes =>
  record => R.pipe(
    R.merge(getNodes(record)),
    newNodes => R.assoc('nodes', newNodes, record)
  )(nodes)

// ====== DELETE

const deleteNode = node => record => {
  // record.nodes = record.nodes.filter(n => n.id !== node.id && n.parentId !== node.id)
  // return record
}

module.exports = {
  // ====== CREATE
  newRecord,
  newNode,
  addNode,

// ====== READ
  getNode,
  getNodeChildren,
  getNodes,
  getNodesArray,
  getNodesByParentId,
  getRootNode,
  getNodeValue,
  getNodesByDefId,

  // ====== UPDATE

  assocNodes,

  // ====== DELETE

  deleteNode,
}