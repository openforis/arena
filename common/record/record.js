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

const getNodeByUUID = uuid => R.path([nodes, uuid])

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

  // ====== UPDATE
  assocNodes,

  // ====== DELETE

  deleteNode,
}