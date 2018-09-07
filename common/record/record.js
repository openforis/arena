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

// ====== READ
const getNodes = R.pipe(
  R.prop(nodes),
  R.defaultTo({}),
)

const getNodesArray = R.pipe(
  getNodes,
  R.values,
)

const getNodeChildren = node => R.pipe(
  getNodesArray,
  R.filter(n => n.parentId === node.id || n.parentUUID === node.uuid),
  R.sort((n1, n2) => {
    return !n1.id
      ? 1
      : !n2.id
        ? -1
        : Number(n1.id) > Number(n2.id)
  }),
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

// ====== UPDATE

const assocNodes = nodes =>
  record => R.pipe(
    R.merge(getNodes(record)),
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
  getParentNode,

  // ====== UPDATE
  assocNodes,

  // ====== DELETE

  deleteNode,
}