const R = require('ramda')
const {uuidv4} = require('./../uuid')

const {getNodeDefParentCodeUUID} = require('../survey/nodeDef')
const {getNodeDefByUUID, getNodeDefById, isNodeDefCodeParent} = require('../survey/survey')
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

const getNodeCodeParentAttribute = (survey, parentNode, nodeDef) =>
  record => {
    const parentCodeDefUUID = getNodeDefParentCodeUUID(nodeDef)
    if (parentCodeDefUUID) {
      const parentCodeDef = getNodeDefByUUID(parentCodeDefUUID)(survey)
      let parentEntity = parentNode
      while (parentEntity) {
        const parentCodes = getNodeChildrenByDefId(parentEntity, parentCodeDef.id)(record)
        if (!R.isEmpty(parentCodes)) {
          return R.head(parentCodes)
        }
        parentEntity = getParentNode(parentEntity)(record)
      }
    }
    return null
  }

const getNodeCodeAncestorValues = (survey, parentNode, nodeDef) =>
  record => {
    const parentCodeAttribute = getNodeCodeParentAttribute(survey, parentNode, nodeDef)(record)
    if (parentCodeAttribute) {
      const parentCodeDef = getNodeDefById(getNodeDefId(parentCodeAttribute))(survey)
      const ancestorCodes = getNodeCodeAncestorValues(survey, getParentNode(parentCodeAttribute)(record), parentCodeDef)(record)
      const parentCodeAttrValue = R.propOr(null, 'code', getNodeValue(parentCodeAttribute))
      return R.append(parentCodeAttrValue, ancestorCodes)
    } else {
      return []
    }
  }

const getNodeCodeDependentAttributes = (survey, node) =>
  record => {
    const nodeDef = getNodeDefById(getNodeDefId(node))(survey)

    return isNodeDefCodeParent(nodeDef)(survey)
      ? findNodes(n => {
        const def = getNodeDefById(getNodeDefId(n))(survey)
        return getNodeDefParentCodeUUID(def) === nodeDef.uuid
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
  getParentNode,
  getNodeCodeAncestorValues,
  getNodeCodeDependentAttributes,

  // ====== UPDATE
  assocNodes,

  // ====== DELETE

  deleteNode,
}