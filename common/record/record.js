const R = require('ramda')
const { uuidv4 } = require('./../uuid')

const Survey = require('../survey/survey')
const SurveyUtils = require('../survey/surveyUtils')
const NodeDef = require('../survey/nodeDef')
const Validator = require('../validation/validator')
const Node = require('./node')
const NodesIndex = require('./_internal/recordNodesIndex')
const User = require('../user/user')
const RecordStep = require('./recordStep')

const keys = {
  uuid: 'uuid',
  nodes: 'nodes',
  ownerId: 'ownerId',
  step: 'step',
  preview: 'preview',
  dateCreated: 'dateCreated'
}

// ====== CREATE

const newRecord = (user, preview = false) => ({
  [keys.uuid]: uuidv4(),
  [keys.ownerId]: User.getId(user),
  [keys.step]: RecordStep.getDefaultStep(),
  [keys.preview]: preview
})

// ====== READ
const getNodes = R.propOr({}, keys.nodes)

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

const findNodesIndexed = predicate => R.pipe(
  getNodes,
  R.filter(predicate)
)

const getNodeChildrenByDefUuid = (parentNode, nodeDefUuid) => record => R.pipe(
  NodesIndex.getNodeUuidsByParentAndDef(Node.getUuid(parentNode), nodeDefUuid),
  R.map(uuid => getNodeByUuid(uuid)(record)),
  nodes =>
    R.sortWith([
      R.propOr(false, Node.keys.placeholder),
      R.prop(Node.keys.dateCreated)
    ])(nodes)
)(record)

const getNodeChildren = node => record => R.pipe(
  NodesIndex.getNodeUuidsByParent(Node.getUuid(node)),
  R.map(uuid => getNodeByUuid(uuid)(record))
)(record)

const getNodeChildByDefUuid = (parentNode, nodeDefUuid) => R.pipe(
  getNodeChildrenByDefUuid(parentNode, nodeDefUuid),
  R.head
)

const getNodeSiblingsByDefUuid = (node, siblingDefUuid) => R.pipe(
  getParentNode(node),
  parentNode => getNodeChildrenByDefUuid(parentNode, siblingDefUuid)
)

const getNodesByDefUuid = nodeDefUuid => record => R.pipe(
  NodesIndex.getNodeUuidsByDef(nodeDefUuid),
  R.map(uuid => getNodeByUuid(uuid)(record))
)(record)

const getRootNode = record => R.pipe(
  NodesIndex.getNodeRootUuid,
  uuid => getNodeByUuid(uuid)(record)
)(record)

const getNodeByUuid = uuid => R.path([keys.nodes, uuid])

const getParentNode = node => getNodeByUuid(Node.getParentUuid(node))

const getAncestorEntitiesAndSelf = entity =>
  record => {
    const ancestors = []

    let parent = entity
    while (parent) {
      ancestors.push(parent)
      parent = getParentNode(parent)(record)
    }
    return ancestors
  }

const findNodeInAncestorEntities = (parentNode, predicate) => record => {
  const ancestors = getAncestorEntitiesAndSelf(parentNode)(record)
  for (const ancestor of ancestors) {
    const children = getNodeChildren(ancestor)(record)
    for (const child of children) {
      if (predicate(child)) {
        return child
      }
    }
  }
  return null
}

const getParentCodeAttribute = (survey, parentNode, nodeDef) =>
  record => {
    const parentCodeDef = Survey.getNodeDefByUuid(NodeDef.getParentCodeDefUuid(nodeDef))(survey)

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

const getDependentCodeAttributes = node => findNodes(n => {
  const hierarchy = Node.getCategoryItemHierarchy(n)
  return R.includes(Node.getUuid(node), hierarchy)
})

const getAncestorByNodeDefUuuid = (node, ancestorDefUuid) =>
  record => {
    const parentNode = getParentNode(node)(record)

    return R.pipe(
      getAncestorEntitiesAndSelf(parentNode),
      R.find(ancestor => Node.getNodeDefUuid(ancestor) === ancestorDefUuid)
    )(record)
  }

const getDescendantsByNodeDefUuid = (node, descendantDefUuid) =>
  findNodes(
    R.and(
      Node.isDescendantOf(node),
      n => Node.getNodeDefUuid(n) === descendantDefUuid
    )
  )

// ====== UPDATE

const assocNodes = nodes =>
  record => {
    // exclude dirty nodes currently being edited by the user

    const dirtyNodes = findNodesIndexed(Node.isDirty)(record)

    const nodesToUpdate = R.pipe(
      R.filter(
        n => {
          const dirtyNode = R.prop(Node.getUuid(n), dirtyNodes)
          return !dirtyNode ||
            Node.isDirty(n) ||
            R.equals(Node.getValue(dirtyNode), Node.getValue(n)) ||
            Node.isValueBlank(dirtyNode) && Node.isDefaultValueApplied(n)
        }),
      R.map(
        R.omit([Node.keys.updated, Node.keys.created])
      )
    )(nodes)

    const nodesDeletedArray = R.pipe(
      R.filter(Node.isDeleted),
      R.values
    )(nodes)

    return R.pipe(
      getNodes,
      R.mergeLeft(nodesToUpdate),
      mergedNodes => R.assoc(keys.nodes, mergedNodes)(record),
      deleteNodes(nodesDeletedArray),
      NodesIndex.addNodes(nodesToUpdate)
    )(record)
  }

const deleteNodes = nodesDeletedArray =>
  record => R.reduce(
    (updatedRecord, node) => deleteNode(node)(updatedRecord),
    record,
    nodesDeletedArray
  )

// ====== DELETE
const deleteNode = node =>
  record => {
    const nodeUuid = Node.getUuid(node)

    // 1. remove entity children recursively
    const children = getNodeChildren(node)(record)

    let recordUpdated = R.reduce(
      (recordAcc, child) => deleteNode(child)(recordAcc),
      record,
      children
    )

    // 2. update validation
    recordUpdated = R.pipe(
      Validator.getValidation,
      Validator.dissocFieldValidation(nodeUuid),
      newValidation => Validator.assocValidation(newValidation)(recordUpdated)
    )(recordUpdated)

    // 3. remove node from index
    recordUpdated = NodesIndex.removeNode(node)(recordUpdated)

    // 4. remove node from record
    recordUpdated = R.pipe(
      getNodes,
      R.dissoc(nodeUuid),
      newNodes => R.assoc(keys.nodes, newNodes, recordUpdated),
    )(recordUpdated)

    return recordUpdated
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

  getNodes,
  getNodesArray,
  getNodesByDefUuid,
  getNodeChildrenByDefUuid,
  getNodeChildByDefUuid,
  getNodeSiblingsByDefUuid,
  getRootNode,
  getNodeByUuid,
  getParentNode,
  getAncestorEntitiesAndSelf,
  getAncestorByNodeDefUuuid,
  getDescendantsByNodeDefUuid,

  // testing
  getCodeUuidsHierarchy,
  getParentCodeAttribute,
  getDependentCodeAttributes,

  // ====== UPDATE
  assocNodes,
  assocNode: node => assocNodes({ [Node.getUuid(node)]: node }),
  mergeNodeValidations: Validator.mergeValidation,

  // ====== DELETE

  deleteNode,

  // ====== VALIDATION
  getValidation: Validator.getValidation,
}