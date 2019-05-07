const R = require('ramda')

const Survey = require('../../survey/survey')
const NodeDef = require('../../survey/nodeDef')
const Node = require('../node')

const keys = require('./recordKeys')
const NodesIndex = require('./recordNodesIndex')

/**
 * === simple getters
 */
const getNodes = R.propOr({}, keys.nodes)

const getNodesArray = R.pipe(getNodes, R.values)

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
 * === find utilities
 */
const findNodes = predicate => R.pipe(
  getNodesArray,
  R.filter(predicate)
)

const findNodesIndexed = predicate => R.pipe(
  getNodes,
  R.filter(predicate)
)

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
const getNodeSiblingsByDefUuid = (node, siblingDefUuid) => R.pipe(
  getParentNode(node),
  parentNode => getNodeChildrenByDefUuid(parentNode, siblingDefUuid)
)

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

/**
 * ==== dependency
 */
const getDependentNodes = (survey, node, dependencyType) => record => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const dependentUuids = Survey.getNodeDefDependencies(nodeDefUuid, dependencyType)(survey)
  const isDependencyApplicable = dependencyType === Survey.dependencyTypes.applicable

  if (dependentUuids) {
    const dependentDefs = Survey.getNodeDefsByUuids(dependentUuids)(survey)

    const dependentsPerDef = dependentDefs.map(
      dependentDef => {
        //1 find common parent def
        const commonParentDefUuid = R.pipe(
          R.intersection(NodeDef.getMetaHierarchy(nodeDef)),
          R.last
        )(NodeDef.getMetaHierarchy(dependentDef))

        //2 find common parent node
        const commonParentNode = getAncestorByNodeDefUuid(node, commonParentDefUuid)(record)

        //3 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
        const nodeDefUuidDependent = isDependencyApplicable
          ? NodeDef.getParentUuid(dependentDef)
          : NodeDef.getUuid(dependentDef)

        const dependentNodes = findNodes(
          node =>
            Node.getNodeDefUuid(node) === nodeDefUuidDependent &&
            Node.isDescendantOf(commonParentNode)(node)
        )(record)

        return dependentNodes.map(nodeCtx => ({
          nodeDef: dependentDef,
          nodeCtx
        }))
      }
    )

    return R.flatten(dependentsPerDef)
  } else {
    return []
  }
}

// code attributes
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

const getParentCodeAttribute = (survey, parentNode, nodeDef) => record => {
  const findNodeInAncestorEntities = (record, parentNode, predicate) => {
    const ancestors = getAncestorsAndSelf(parentNode)(record)
    return ancestors.find(
      ancestor => {
        const children = getNodeChildren(ancestor)(record)
        return !!children.find(predicate)
      }
    )
  }

  const parentCodeDef = Survey.getNodeDefByUuid(NodeDef.getParentCodeDefUuid(nodeDef))(survey)
  return parentCodeDef && findNodeInAncestorEntities(
    record,
    parentNode,
    node => Node.getNodeDefUuid(node) === NodeDef.getUuid(parentCodeDef)
  )
}

module.exports = {
  getNodes,
  getNodesArray,
  getNodeByUuid,
  getRootNode,
  getNodesByDefUuid,

  findNodes,
  findNodesIndexed,

  // ==== hierarchy
  // ancestors
  getParentNode,
  getAncestorsAndSelf,
  getAncestorByNodeDefUuid,

  // siblings
  getNodeSiblingsByDefUuid,

  // descendants
  getNodeChildren,
  getNodeChildrenByDefUuid,
  getNodeChildByDefUuid,

  // ==== dependency
  getDependentNodes,

  // code
  getCodeUuidsHierarchy,
  getParentCodeAttribute,
  getDependentCodeAttributes,
}