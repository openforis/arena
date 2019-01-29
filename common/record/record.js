const R = require('ramda')
const { uuidv4 } = require('./../uuid')

const Survey = require('../survey/survey')
const SurveyUtils = require('../survey/surveyUtils')
const NodeDef = require('../survey/nodeDef')
const Validator = require('../validation/validator')
const Node = require('../record/node')
const User = require('../user/user')
const RecordStep = require('./recordStep')

const keys = {
  nodes: 'nodes',
  ownerId: 'ownerId',
  step: 'step',
  preview: 'preview',
}
// ====== CREATE

const newRecord = (user, preview = false) => ({
  uuid: uuidv4(),
  ownerId: User.getId(user),
  step: RecordStep.getDefaultStep(),
  preview
})

// ====== READ
const getNodes = R.pipe(
  R.prop(keys.nodes),
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

const getNodeChildren = node => findNodes(n => Node.getParentUuid(n) === node.uuid)

const getNodeChildrenByDefUuid = (parentNode, nodeDefUuid) => record => R.pipe(
  getNodeChildren(parentNode),
  R.filter(n => Node.getNodeDefUuid(n) === nodeDefUuid),
)(record)

const getNodesByDefUuid = (nodeDefUuid) => record => R.pipe(
  getNodesArray,
  R.filter(n => Node.getNodeDefUuid(n) === nodeDefUuid),
)(record)

const getRootNode = R.pipe(
  getNodesArray,
  R.find(R.propEq('parentUuid', null)),
)

const getNodeByUuid = uuid => R.path([keys.nodes, uuid])

const getParentNode = node => getNodeByUuid(Node.getParentUuid(node))

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
    const parentCodeDef = Survey.getNodeDefByUuid(NodeDef.getNodeDefParentCodeDefUuid(nodeDef))(survey)

    return parentCodeDef
      ? findNodeInAncestorEntities(parentNode,
        node => Node.getNodeDefUuid(node) === parentCodeDef.uuid
      )(record)
      : null
  }

const getCodeUuidsHierarchy = (survey, parentEntity, nodeDef) => record => {
  const parentCode = getParentCodeAttribute(survey, parentEntity, nodeDef)(record)

  return parentCode
    ? R.append(
      parentCode.uuid,
      getCodeUuidsHierarchy(
        survey,
        getParentNode(parentCode)(record),
        Survey.getNodeDefByUuid(Node.getNodeDefUuid(parentCode))(survey)
      )(record),
    )
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
  getUuid: SurveyUtils.getUuid,
  isPreview: R.propEq(keys.preview, true),
  getOwnerId: R.prop(keys.ownerId),
  getStep: R.prop(keys.step),
  getValidation: Validator.getValidation,

  getNodes,
  getNodesArray,
  getNodesByDefUuid,
  getNodeChildrenByDefUuid,
  getRootNode,
  getNodeByUuid,
  getParentNode,

  // testing
  getCodeUuidsHierarchy: getCodeUuidsHierarchy,
  getParentCodeAttribute,

  // ====== UPDATE
  assocNodes,
  mergeNodeValidations: Validator.mergeValidation,

  // ====== DELETE

  deleteNode,
}