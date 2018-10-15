const R = require('ramda')
const {uuidv4} = require('./../uuid')

const {getNodeDefParentCodeUUID} = require('../survey/nodeDef')
const {getNodeDefByUUID, getNodeDefById} = require('../survey/survey')
const {getNodeDefId, getNodeValue} = require('../record/node')

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
  R.filter(n => n.parentId ? n.parentId === node.id : n.parentUUID === node.uuid),
  // R.sort((n1, n2) => {
  //   return !n1.id
  //     ? 1
  //     : !n2.id
  //       ? -1
  //       : Number(n1.id) < Number(n2.id)
  // }),
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

const getNodeCodeParent = (survey, record, parentNode, nodeDef) => {
  const parentCodeDefUUID = getNodeDefParentCodeUUID(nodeDef)
  if (parentCodeDefUUID) {
    const parentCodeDef = getNodeDefByUUID(parentCodeDefUUID)(survey)
    let parentEntity = parentNode
    while (parentEntity !== null) {
      const children = getNodeChildren(parentEntity)(record)
      const parentCode = R.find(child => {
        return getNodeDefId(child) === parentCodeDef.id
      })(children)
      if (parentCode) {
        return parentCode
      }
      parentEntity = getParentNode(parentEntity)(record)
    }
  } else {
    return null
  }
}

const getNodeCodeAncestorAndSelfValues = (survey, parentNode, nodeDef) => record => {
  const nodeCodeParent = getNodeCodeParent(survey, parentNode, nodeDef)
  if (nodeCodeParent) {
    const parentCodeDef = getNodeDefById(getNodeDefId(nodeCodeParent))(survey)
    const ancestorCodes = getNodeCodeAncestorAndSelfValues(survey, getParentNode(nodeCodeParent), parentCodeDef)(record)
    if (R.isEmpty(ancestorCodes)) {
      return []
    } else {
      return R.append(getNodeValue(nodeCodeParent).code, ancestorCodes)
    }
  } else {
    return []
  }
}

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
  getNodeCodeAncestorAndSelfValues,

  // ====== UPDATE
  assocNodes,

  // ====== DELETE

  deleteNode,
}