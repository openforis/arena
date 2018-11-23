const R = require('ramda')
const {uuidv4} = require('./../uuid')

const NodeDef = require('../survey/nodeDef')
const Survey = require('../survey/survey')
const Node = require('../record/node')

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

// ====== READ
const getNodes = R.pipe(
  R.prop(nodes),
  R.defaultTo({}),
)

const getNodesArray = R.pipe(
  getNodes,
  R.values,
)

const findNodes = predicate => R.pipe(
  getNodesArray,
  R.filter(predicate)
  // R.sort((n1, n2) => {
  //   return !n1.id
  //     ? 1
  //     : !n2.id
  //       ? -1
  //       : Number(n1.id) < Number(n2.id)
  // }),
)

const getNodeChildren = node => findNodes(
  n => n.parentId ? n.parentId === node.id : n.parentUUID === node.uuid
)

const getNodeChildrenByDefId = (parentNode, nodeDefId) => record => R.pipe(
  getNodeChildren(parentNode),
  R.filter(n => n.nodeDefId === nodeDefId),
)(record)

const getRootNode = R.pipe(
  getNodesArray,
  R.find(R.propEq('parentId', null)),
)

const getNodeByUUID = uuid => R.path([nodes, uuid])

const getNodeById = id => R.pipe(
  getNodesArray,
  R.find(R.propEq('id', id))
)

const getParentNode = node => node.parentId
  ? getNodeById(node.parentId)
  : node.parentUUID
    ? getNodeByUUID(node.parentUUID)
    : R.F

const findNodeInAncestorEntities = (parentNode, predicate) => record => {
  let parentEntity = parentNode
  while (parentEntity) {
    const children = getNodeChildren(parentEntity)(record)
    for (let child of children) {
      if (predicate(child)) {
        return child
      }
    }
    parentEntity = getParentNode(parentEntity)(record)
  }
  return null
}

const getParentCodeAttribute = (survey, parentNode, nodeDef) =>
  record => {
    const parentCodeDef = Survey.getNodeDefByUUID(NodeDef.getNodeDefParentCodeUUID(nodeDef))(survey)
    return parentCodeDef
      ? findNodeInAncestorEntities(parentNode,
        node => Node.getNodeDefId(node) === parentCodeDef.id
      )(record)
      : null
  }

const getNodeCodeDependentAttributes = (survey, node) =>
  record => {
    const nodeDef = Survey.getNodeDefById(Node.getNodeDefId(node))(survey)

    return Survey.isNodeDefParentCode(nodeDef)(survey)
      ? findNodes(n => {
        const def = Survey.getNodeDefById(Node.getNodeDefId(n))(survey)
        return NodeDef.getNodeDefParentCodeUUID(def) === nodeDef.uuid
      })(record)
      : []
  }

// ====== UPDATE

const assocNodes = nodes =>
  record => R.pipe(
    R.merge(getNodes(record)),
    //remove deleted nodes
    newNodes => R.reduce((acc, uuid) => R.prop(uuid)(newNodes).deleted ? R.dissoc(uuid)(acc) : acc, newNodes)(R.keys(newNodes)),
    newNodes => R.assoc('nodes', newNodes, record)
  )(nodes)

// ====== DELETE
const deleteNode = node =>
  record => {
    //remove itself
    const updatedRecord = R.pipe(
      getNodes,
      R.dissoc(node.uuid),
      newNodes => R.assoc('nodes', newNodes, record)
    )(record)

    //remove entity children recursively
    const children = getNodeChildren(node)(updatedRecord)
    return R.isEmpty(children)
      ? updatedRecord
      : R.reduce(
        (recordCurrent, child) => deleteNode(child)(recordCurrent),
        updatedRecord,
        children
      )
  }

module.exports = {
  // ====== CREATE
  newRecord,

  // ====== READ
  getNodes,
  getNodesArray,
  getNodeChildrenByDefId,
  getRootNode,
  getNodeByUUID,
  getParentCodeAttribute,
  getNodeCodeDependentAttributes,

  // ====== UPDATE
  assocNodes,

  // ====== DELETE

  deleteNode,
}