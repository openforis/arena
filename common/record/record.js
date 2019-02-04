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
  uuid: 'uuid',
  nodes: 'nodes',
  ownerId: 'ownerId',
  step: 'step',
  preview: 'preview',
}
// ====== CREATE

const newRecord = (user, preview = false) => ({
  [keys.uuid]: uuidv4(),
  [keys.ownerId]: User.getId(user),
  [keys.step]: RecordStep.getDefaultStep(),
  [keys.preview]: preview
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

const getNodeChildren = node => findNodes(n => Node.getParentUuid(n) === Node.getUuid(node))

const getNodeChildrenByDefUuid = (parentNode, nodeDefUuid) => record => R.pipe(
  getNodeChildren(parentNode),
  R.filter(n => Node.getNodeDefUuid(n) === nodeDefUuid),
  // Put placeholder at the end for multiple nodes if another user is editing the same record
  R.sortBy(R.propOr(false, Node.keys.placeholder))
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
        node => Node.getNodeDefUuid(node) === NodeDef.getUuid(parentCodeDef)
      )(record)
      : null
  }

const getCodeUuidsHierarchy = (survey, parentEntity, nodeDef) => record => {
  const parentCode = getParentCodeAttribute(survey, parentEntity, nodeDef)(record)

  return parentCode
    ? R.append(
      Node.getUuid(parentCode),
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
    getNodes,
    R.mergeLeft(nodes),
    mergedNodes => R.assoc('nodes', mergedNodes)(record),
    //remove deleted nodes
    updatedRecord => {
      const deletedNodes = R.pipe(
        getNodes,
        R.values,
        R.filter(
          R.propEq(Node.keys.deleted, true)
        )
      )(updatedRecord)

      return R.reduce((acc, node) => deleteNode(node)(record), updatedRecord, deletedNodes)
    }
  )(record)

// ====== DELETE
const deleteNode = node =>
  record => {
    const nodeUuid = Node.getUuid(node)

    // 1. remove node from record
    const recordUpdated = R.pipe(
      getNodes,
      R.dissoc(nodeUuid),
      newNodes => R.assoc('nodes', newNodes, record),
    )(record)

    // 2. update validation
    const recordValidationUpdated = R.pipe(
      Validator.getValidation,
      Validator.dissocFieldValidation(nodeUuid),
      newValidation => Validator.assocValidation(newValidation)(recordUpdated)
    )(recordUpdated)

    // 3. remove entity children recursively
    const children = getNodeChildren(node)(recordValidationUpdated)

    return R.reduce(
      (recordCurrent, child) => deleteNode(child)(recordCurrent),
      recordValidationUpdated,
      children
    )
  }

module.exports = {
  keys,

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