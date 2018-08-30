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

const newNode = (nodeDefId, recordId, parentId = null, value = null) => {
  return {
    uuid: uuidv4(),
    nodeDefId,
    recordId,
    parentId,
    value,
  }
}

const addNode = node => R.assocPath(['nodes', node.uuid], node)

// ====== READ
const getNodes = R.pipe(
  R.prop(nodes),
  R.defaultTo({}),
)

const getNodesArray = R.pipe(
  getNodes,
  R.values,
)

const getNodesByParentId = parentId => R.pipe(
  getNodesArray,
  R.filter(n => n.parentId === parentId),
  R.sortBy(R.prop('id')),
)

const getNodeChildren = node => getNodesByParentId(R.propOr(null, 'id')(node))

const getNodeChildrenByDefId = (parentNode, nodeDefId) => record => R.pipe(
  getNodeChildren(parentNode),
  R.filter(n => n.nodeDefId === nodeDefId),
)(record)

const getRootNode = R.pipe(
  getNodesByParentId(null),
  R.head,
)

const getNodeValue = (node, defaultValue = {}) => R.pipe(
  R.prop('value'),
  R.defaultTo(defaultValue)
)(node)

// ====== UPDATE

const assocNodes = nodes =>
  record => R.pipe(
    R.merge(getNodes(record)),
    //exclude deleted nodes
    R.values,
    R.filter(n => R.not(R.prop('deleted', n))),
    //transform into dictionary (indexed by uuid)
    R.reduce((acc, n) => R.assoc(n.uuid, n)(acc), {}),
    newNodes => R.assoc('nodes', newNodes, record)
  )(nodes)

// ====== DELETE

const deleteNode = node =>
  record => R.pipe(
    getNodes,
    R.dissoc(node.uuid)
  )(record)

module.exports = {
  // ====== CREATE
  newRecord,
  newNode,
  addNode,

// ====== READ
  getNodes,
  getNodesArray,
  getNodeChildren,
  getNodesByParentId,
  getRootNode,
  getNodeValue,
  getNodeChildrenByDefId,

  // ====== UPDATE

  assocNodes,

  // ====== DELETE

  deleteNode,
}