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
  nodesByParent: 'nodesByParent',
  nodesByNodeDef: 'nodesByNodeDef',
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

const getNodeChildren = node => findNodes(n => Node.getParentUuid(n) === Node.getUuid(node))

const getNodeChildrenByDefUuid = (parentNode, nodeDefUuid) => record => R.pipe(
  getNodeChildrenUuidsByParent(Node.getUuid(parentNode), nodeDefUuid),
  R.map(uuid => getNodeByUuid(uuid)(record)),
  R.sortWith([
    R.propOr(false, Node.keys.placeholder),
    R.prop(Node.keys.dateCreated)
  ])
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
  getNodeUuidsByNodeDef(nodeDefUuid),
  R.map(uuid => getNodeByUuid(uuid)(record))
)(record)

const getRootNode = R.pipe(
  getNodesArray,
  R.find(R.propEq(Node.keys.parentUuid, null)),
)

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

    const recordUpdated = R.pipe(
      getNodes,
      R.mergeLeft(nodesToUpdate),
      mergedNodes => R.assoc(keys.nodes, mergedNodes)(record),
      removeDeletedNodes,

      record => R.pipe(
        R.values,
        R.reduce(
          (acc, node) => indexNode(node)(acc),
          record
        )
      )(nodesToUpdate)
    )(record)

    return recordUpdated
  }

const removeDeletedNodes = record => {
  const deletedNodes = findNodes(R.propEq(Node.keys.deleted, true))(record)

  return R.reduce(
    (updatedRecord, node) => deleteNode(node)(updatedRecord),
    record,
    deletedNodes
  )
}

// ====== DELETE
const deleteNode = node =>
  record => {
    const nodeUuid = Node.getUuid(node)

    // 1. remove node from record
    const recordUpdated = R.pipe(
      getNodes,
      R.dissoc(nodeUuid),
      newNodes => R.assoc(keys.nodes, newNodes, record),
    )(record)

    // 2. update validation
    const recordValidationUpdated = R.pipe(
      Validator.getValidation,
      Validator.dissocFieldValidation(nodeUuid),
      newValidation => Validator.assocValidation(newValidation)(recordUpdated)
    )(recordUpdated)

    const recordCacheUpdated = removeNodeFromIndex(node)(recordValidationUpdated)

    // 3. remove entity children recursively
    const children = getNodeChildren(node)(recordCacheUpdated)

    return R.reduce(
      (recordCurrent, child) => deleteNode(child)(recordCurrent),
      recordCacheUpdated,
      children
    )
  }

// ======= CACHE

const getNodeUuidsByNodeDef = nodeDefUuid => R.pathOr([], [keys.nodesByNodeDef, nodeDefUuid])

const getNodeChildrenUuidsByParent = (parentNodeUuid, childDefUuid) => R.pathOr([], [keys.nodesByParent, parentNodeUuid, childDefUuid])

const indexNodeByNodeDef = node => record => R.pipe(
  getNodeUuidsByNodeDef(Node.getNodeDefUuid(node)),
  R.ifElse(
    R.includes(Node.getUuid(node)),
    R.identity,
    R.append(Node.getUuid(node))
  ),
  arr => R.assocPath([keys.nodesByNodeDef, Node.getNodeDefUuid(node)], arr, record)
)(record)

const indexNodeByParent = node => record => R.pipe(
  getNodeChildrenUuidsByParent(Node.getParentUuid(node), Node.getNodeDefUuid(node)),
  R.ifElse(
    R.includes(Node.getUuid(node)),
    R.identity,
    R.append(Node.getUuid(node))
  ),
  arr => R.assocPath([keys.nodesByParent, Node.getParentUuid(node), Node.getNodeDefUuid(node)], arr, record)
)(record)

const indexNode = node => R.pipe(
  indexNodeByParent(node),
  indexNodeByNodeDef(node)
)

const removeNodeFromIndexByParent = node => record => R.pipe(
  getNodeChildrenUuidsByParent(Node.getParentUuid(node), Node.getNodeDefUuid(node)),
  R.without([Node.getUuid(node)]),
  arr => R.assocPath([keys.nodesByParent, Node.getParentUuid(node), Node.getNodeDefUuid(node)], arr)(record)
)(record)

const removeNodeFromIndexByNodeDef = node => record => R.pipe(
  getNodeUuidsByNodeDef(Node.getNodeDefUuid(node)),
  R.without([Node.getUuid(node)]),
  arr => R.assocPath([keys.nodesByNodeDef, Node.getNodeDefUuid(node)], arr)(record)
)(record)

const removeNodeFromIndex = node => R.pipe(
  removeNodeFromIndexByParent(node),
  removeNodeFromIndexByNodeDef(node)
)

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