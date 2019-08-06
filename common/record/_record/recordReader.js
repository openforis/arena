const R = require('ramda')

const Queue = require('../../../common/queue')

const SurveyNodeDefs = require('../../survey/_survey/surveyNodeDefs')
const SurveyDependencies = require('../../survey/_survey/surveyDependencies')
const NodeDef = require('../../survey/nodeDef')
const Node = require('../node')

const keys = require('./recordKeys')
const NodesIndex = require('./recordNodesIndex')

/**
 * === simple getters
 */
const getNodes = R.propOr({}, keys.nodes)

const getNodeByUuid = uuid => R.path([keys.nodes, uuid])

const getRootNode = record => R.pipe(
  NodesIndex.getNodeRootUuid,
  uuid => getNodeByUuid(uuid)(record)
)(record)

const getNodesByDefUuid = nodeDefUuid => record => R.pipe(
  NodesIndex.getNodeUuidsByDef(nodeDefUuid),
  R.map(uuid => getNodeByUuid(uuid)(record))
)(record)

/**
 * ==== hierarchy
 */
// ancestors
const getParentNode = node => getNodeByUuid(Node.getParentUuid(node))

const getAncestorsAndSelf = entity => record => {
  const ancestors = []
  while (entity) {
    ancestors.push(entity)
    entity = getParentNode(entity)(record)
  }
  return ancestors
}

const getAncestorByNodeDefUuid = (node, ancestorDefUuid) => record =>
  R.pipe(
    getParentNode(node),
    parentNode => getAncestorsAndSelf(parentNode)(record),
    R.find(ancestor => Node.getNodeDefUuid(ancestor) === ancestorDefUuid)
  )(record)

// siblings
const getNodeSiblingsAndSelf = node => record => R.pipe(
  getParentNode(node),
  parentNode => getNodeChildrenByDefUuid(parentNode, Node.getNodeDefUuid(node))(record)
)(record)

// descendants
const getNodeChildren = node => record => R.pipe(
  NodesIndex.getNodeUuidsByParent(Node.getUuid(node)),
  R.map(uuid => getNodeByUuid(uuid)(record))
)(record)

const getNodeChildrenByDefUuid = (parentNode, nodeDefUuid) => record => R.pipe(
  NodesIndex.getNodeUuidsByParentAndDef(Node.getUuid(parentNode), nodeDefUuid),
  R.map(uuid => getNodeByUuid(uuid)(record)),
  nodes =>
    R.sortWith([
      R.propOr(false, Node.keys.placeholder),
      R.prop(Node.keys.dateCreated)
    ])(nodes)
)(record)

const getNodeChildByDefUuid = (parentNode, nodeDefUuid) => R.pipe(
  getNodeChildrenByDefUuid(parentNode, nodeDefUuid),
  R.head
)

const visitDescendantsAndSelf = (node, visitor) => record => {
  const queue = new Queue()

  queue.enqueue(node)

  while (!queue.isEmpty()) {
    const node = queue.dequeue()

    visitor(node)

    const children = getNodeChildren(node)(record)
    queue.enqueueItems(children)
  }
}

/**
 * Returns true if a node and all its ancestors are applicable
 */
const isNodeApplicable = node => record => {
  if (Node.isRoot(node))
    return true

  const nodeParent = getParentNode(node)(record)
  const isApplicable = Node.isChildApplicable(Node.getNodeDefUuid(node))(nodeParent)
  if (isApplicable) {
    return isNodeApplicable(nodeParent)(record)
  } else {
    return false
  }
}

/**
 * ==== dependency
 */
/**
 * Returns a list of dependent node pointers.
 * Every item in the list is in the format:
 * {
 *   nodeCtx, //context node
 *   nodeDef, //node definition
 * }
 */
const getDependentNodePointers = (survey, node, dependencyType, includeSelf = false, filterFn = null) => record => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = SurveyNodeDefs.getNodeDefByUuid(nodeDefUuid)(survey)
  const dependentUuids = SurveyDependencies.getNodeDefDependencies(nodeDefUuid, dependencyType)(survey)

  const nodePointers = []

  if (dependentUuids) {
    const dependentDefs = SurveyNodeDefs.getNodeDefsByUuids(dependentUuids)(survey)

    for (const dependentDef of dependentDefs) {
      //1 find common parent def
      const commonParentDefUuid = R.pipe(
        R.intersection(NodeDef.getMetaHierarchy(nodeDef)),
        R.last
      )(NodeDef.getMetaHierarchy(dependentDef))

      //2 find common parent node
      const commonParentNode = getAncestorByNodeDefUuid(node, commonParentDefUuid)(record)

      //3 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
      const isDependencyApplicable = dependencyType === SurveyDependencies.dependencyTypes.applicable

      const nodeDefUuidDependent = isDependencyApplicable
        ? NodeDef.getParentUuid(dependentDef)
        : NodeDef.getUuid(dependentDef)

      const nodeDependents = getNodesByDefUuid(nodeDefUuidDependent)(record)
      for (const nodeDependent of nodeDependents) {
        if (Node.isDescendantOf(commonParentNode)(nodeDependent) ||
          (
            isDependencyApplicable && Node.getUuid(nodeDependent) === Node.getUuid(commonParentNode)
          )
        ) {
          const nodePointer = {
            nodeDef: dependentDef,
            nodeCtx: nodeDependent
          }
          if (filterFn === null || filterFn(nodePointer)) {
            nodePointers.push(nodePointer)
          }
        }
      }
    }
  }
  if (includeSelf) {
    const nodePointerSelf = {
      nodeDef,
      nodeCtx: node
    }
    if (filterFn === null || filterFn(nodePointerSelf)) {
      nodePointers.push(nodePointerSelf)
    }
  }

  return nodePointers
}

// code attributes
const getDependentCodeAttributes = node => record => R.pipe(
  NodesIndex.getNodeCodeDependentUuids(Node.getUuid(node)),
  R.map(uuid => getNodeByUuid(uuid)(record))
)(record)

const getParentCodeAttribute = (survey, parentNode, nodeDef) => record => {
  const parentCodeDefUuid = NodeDef.getParentCodeDefUuid(nodeDef)

  if (parentCodeDefUuid) {
    const ancestors = getAncestorsAndSelf(parentNode)(record)
    for (const ancestor of ancestors) {
      const children = getNodeChildren(ancestor)(record)
      const nodeFound = children.find(node => Node.getNodeDefUuid(node) === parentCodeDefUuid)
      if (nodeFound)
        return nodeFound
    }
  }
  return null
}

// ====== Keys

const getEntityKeyNodes = (survey, nodeEntity) => record => {
  const nodeDefEntity = SurveyNodeDefs.getNodeDefByUuid(Node.getNodeDefUuid(nodeEntity))(survey)
  const nodeDefKeys = SurveyNodeDefs.getNodeDefKeys(nodeDefEntity)(survey)

  return R.pipe(
    R.map(nodeDefKey => getNodeChildByDefUuid(nodeEntity, NodeDef.getUuid(nodeDefKey))(record)),
    R.flatten,
  )(nodeDefKeys)
}

const getEntityKeyValues = (survey, nodeEntity) => R.pipe(
  getEntityKeyNodes(survey, nodeEntity),
  R.map(Node.getValue)
)

module.exports = {
  getNodes,
  getNodeByUuid,
  getRootNode,
  getNodesByDefUuid,

  // ==== hierarchy
  // ancestors
  getParentNode,
  getAncestorsAndSelf,
  getAncestorByNodeDefUuid,

  // siblings
  getNodeSiblingsAndSelf,

  // descendants
  getNodeChildren,
  getNodeChildrenByDefUuid,
  getNodeChildByDefUuid,
  visitDescendantsAndSelf,
  isNodeApplicable,

  // ==== dependency
  getDependentNodePointers,

  // code
  getParentCodeAttribute,
  getDependentCodeAttributes,

  // ====== Keys
  getEntityKeyNodes,
  getEntityKeyValues,
}