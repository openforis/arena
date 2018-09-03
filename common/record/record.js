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

const newNode = (nodeDefId, recordId, parentId = null, placeholder = false ,value = null) => {
  return {
    uuid: uuidv4(),
    nodeDefId,
    recordId,
    parentId,
    placeholder,
    value,
  }
}

const newNodePlaceholder = (nodeDef, parentNode) =>
  newNode(nodeDef.id, parentNode.recordId, parentNode.id, true)

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

const getNodeValue = (node = {}, defaultValue = {}) => R.pipe(
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
//TODO remove entity children recursively
const deleteNode = node =>
  record => R.pipe(
    getNodes,
    R.dissoc(node.uuid),
    newNodes => R.assoc('nodes', newNodes, record)
  )(record)

module.exports = {
  // ====== CREATE
  newRecord,
  newNode,
  newNodePlaceholder,

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