import * as R from 'ramda'

import Queue from '@core/queue'

import * as SurveyNodeDefs from '@core/survey/_survey/surveyNodeDefs'
import * as SurveyDependencies from '@core/survey/_survey/surveyDependencies'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as ObjectUtils from '@core/objectUtils'
import * as Node from '../node'

import { keys } from './recordKeys'
import * as NodesIndex from './recordNodesIndex'

/**
 * === simple getters.
 */
export const getNodes = R.propOr({}, keys.nodes)

export const getNodeByUuid = (uuid) => R.path([keys.nodes, uuid])

export const getRootNode = (record) => R.pipe(NodesIndex.getNodeRootUuid, (uuid) => getNodeByUuid(uuid)(record))(record)

export const getNodesByDefUuid = (nodeDefUuid) => (record) =>
  R.pipe(
    NodesIndex.getNodeUuidsByDef(nodeDefUuid),
    R.map((uuid) => getNodeByUuid(uuid)(record))
  )(record)

/**.
 * ==== hierarchy
 *
 * @param node
 */
// ancestors
export const getParentNode = (node) => getNodeByUuid(Node.getParentUuid(node))

export const visitAncestorsAndSelf =
  ({ node, visitor }) =>
  (record) => {
    let currentNode = node
    while (currentNode) {
      visitor(currentNode)
      currentNode = getParentNode(currentNode)(record)
    }
  }

/**.
 * Returns the list of ancestors from the given node to the root entity
 *
 * @param node
 */
export const getAncestorsAndSelf = (node) => (record) => {
  const ancestors = []
  visitAncestorsAndSelf({
    node,
    visitor: (currentNode) => {
      ancestors.push(currentNode)
    },
  })(record)
  return ancestors
}

export const getAncestorByNodeDefUuid = (node, ancestorDefUuid) => (record) =>
  R.pipe(
    getParentNode(node),
    (parentNode) => getAncestorsAndSelf(parentNode)(record),
    R.find((ancestor) => Node.getNodeDefUuid(ancestor) === ancestorDefUuid)
  )(record)

// Descendants
export const getNodeChildren = (node) => (record) =>
  R.pipe(
    NodesIndex.getNodeUuidsByParent(Node.getUuid(node)),
    R.map((uuid) => getNodeByUuid(uuid)(record))
  )(record)

export const getNodeChildrenByDefUuidUnsorted = (parentNode, nodeDefUuid) => (record) =>
  R.pipe(
    NodesIndex.getNodeUuidsByParentAndDef(Node.getUuid(parentNode), nodeDefUuid),
    R.map((uuid) => getNodeByUuid(uuid)(record))
  )(record)

export const getNodeChildrenByDefUuid = (parentNode, nodeDefUuid) => (record) => {
  const children = getNodeChildrenByDefUuidUnsorted(parentNode, nodeDefUuid)(record)
  return children.sort((node1, node2) => {
    if (Node.isPlaceholder(node1) && !Node.isPlaceholder(node2)) return 1
    if (!Node.isPlaceholder(node1) && Node.isPlaceholder(node2)) return -1
    if (node1.id < node2.id || node1.dateCreated < node2.dateCreated) return -1
    if (node1.id > node2.id || node1.dateCreated > node2.dateCreated) return 1
    return 0
  })
}

export const getNodeChildByDefUuid = (parentNode, nodeDefUuid) =>
  R.pipe(getNodeChildrenByDefUuid(parentNode, nodeDefUuid), R.head)

export const visitDescendantsAndSelf = (node, visitor) => (record) => {
  const queue = new Queue()

  queue.enqueue(node)

  while (!queue.isEmpty()) {
    const node = queue.dequeue()

    visitor(node)

    const children = getNodeChildren(node)(record)
    queue.enqueueItems(children)
  }
}

/**.
 * Returns true if a node and all its ancestors are applicable
 *
 * @param node
 */
export const isNodeApplicable = (node) => (record) => {
  if (Node.isRoot(node)) {
    return true
  }

  const nodeParent = getParentNode(node)(record)
  const isApplicable = Node.isChildApplicable(Node.getNodeDefUuid(node))(nodeParent)
  if (isApplicable) {
    return isNodeApplicable(nodeParent)(record)
  }

  return false
}

/**
 * ==== dependency.
 */
/**
 * Returns a list of dependent node pointers.
 * Every item in the list is in the format:
 * {
 *   nodeCtx, //context node
 *   nodeDef, //node definition
 * }.
 *
 * @param survey
 * @param node
 * @param dependencyType
 * @param includeSelf
 * @param filterFn
 */
export const getDependentNodePointers =
  (survey, node, dependencyType, includeSelf = false, filterFn = null) =>
  (record) => {
    const nodeDefUuid = Node.getNodeDefUuid(node)
    const nodeDef = SurveyNodeDefs.getNodeDefByUuid(nodeDefUuid)(survey)
    const dependentNodeDefUuids = SurveyDependencies.getNodeDefDependenciesUuids(nodeDefUuid, dependencyType)(survey)

    const nodePointers = []

    if (dependentNodeDefUuids) {
      const dependentDefs = SurveyNodeDefs.getNodeDefsByUuids(dependentNodeDefUuids)(survey)

      for (const dependentDef of dependentDefs) {
        // 1 find common parent def
        const commonParentDefUuid = R.pipe(
          R.intersection(NodeDef.getMetaHierarchy(nodeDef)),
          R.last
        )(NodeDef.getMetaHierarchy(dependentDef))

        // 2 find common parent node
        const commonParentNode = getAncestorByNodeDefUuid(node, commonParentDefUuid)(record)

        // 3 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
        const isDependencyApplicable = dependencyType === SurveyDependencies.dependencyTypes.applicable

        const nodeDefUuidDependent = isDependencyApplicable
          ? NodeDef.getParentUuid(dependentDef)
          : NodeDef.getUuid(dependentDef)

        const nodeDependents = getNodesByDefUuid(nodeDefUuidDependent)(record)
        for (const nodeDependent of nodeDependents) {
          if (
            Node.isDescendantOf(commonParentNode)(nodeDependent) ||
            (isDependencyApplicable && Node.getUuid(nodeDependent) === Node.getUuid(commonParentNode))
          ) {
            const nodePointer = {
              nodeDef: dependentDef,
              nodeCtx: nodeDependent,
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
        nodeCtx: node,
      }
      if (filterFn === null || filterFn(nodePointerSelf)) {
        nodePointers.push(nodePointerSelf)
      }
    }

    return nodePointers
  }

// Code attributes
export const getDependentCodeAttributes = (node) => (record) =>
  R.pipe(
    NodesIndex.getNodeCodeDependentUuids(Node.getUuid(node)),
    R.map((uuid) => getNodeByUuid(uuid)(record))
  )(record)

export const getParentCodeAttribute = (survey, parentNode, nodeDef) => (record) => {
  const parentCodeDefUuid = NodeDef.getParentCodeDefUuid(nodeDef)

  if (parentCodeDefUuid) {
    const ancestors = getAncestorsAndSelf(parentNode)(record)
    for (const ancestor of ancestors) {
      const children = getNodeChildren(ancestor)(record)
      const nodeFound = children.find((node) => Node.getNodeDefUuid(node) === parentCodeDefUuid)
      if (nodeFound) {
        return nodeFound
      }
    }
  }

  return null
}

// ====== Keys

export const getEntityKeyNodes = (survey, nodeEntity) => (record) => {
  const nodeDefEntity = SurveyNodeDefs.getNodeDefByUuid(Node.getNodeDefUuid(nodeEntity))(survey)
  const nodeDefKeys = SurveyNodeDefs.getNodeDefKeys(nodeDefEntity)(survey)

  return R.pipe(
    R.map((nodeDefKey) => getNodeChildByDefUuid(nodeEntity, NodeDef.getUuid(nodeDefKey))(record)),
    R.flatten
  )(nodeDefKeys)
}

export const getEntityKeyValues = (survey, nodeEntity) =>
  R.pipe(getEntityKeyNodes(survey, nodeEntity), R.map(Node.getValue))

export const getAttributesUniqueSibling = ({ record, attribute, attributeDef }) => {
  const parentEntity = getParentNode(attribute)(record)
  const ancestorEntity = getParentNode(parentEntity)(record)
  const siblingParentEntities = getNodeChildrenByDefUuid(ancestorEntity, NodeDef.getParentUuid(attributeDef))(record)

  return siblingParentEntities.reduce(
    (siblingsAcc, siblingEntity) => [
      ...siblingsAcc,
      ...getNodeChildrenByDefUuid(siblingEntity, NodeDef.getUuid(attributeDef))(record),
    ],
    []
  )
}

const _isNodeDefUnique = (nodeDef) => NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))

export const getAttributesUniqueDependent = ({ survey, record, node }) => {
  const nodeDef = SurveyNodeDefs.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (NodeDef.isSingleEntity(nodeDef)) return {}

  let siblingUniqueAttributes = []
  if (NodeDef.isEntity(nodeDef)) {
    const nodeDefsUnique = SurveyNodeDefs.getNodeDefChildren(nodeDef)(survey).filter(_isNodeDefUnique)

    siblingUniqueAttributes = nodeDefsUnique.reduce((siblingsAcc, nodeDefUnique) => {
      if (NodeDef.isSingle(nodeDefUnique)) {
        const attribute = getNodeChildByDefUuid(node, NodeDef.getUuid(nodeDefUnique))(record)
        siblingsAcc.push(...getAttributesUniqueSibling({ record, attribute, attributeDef: nodeDefUnique }))
      }
      return siblingsAcc
    }, [])
  } else if (_isNodeDefUnique(nodeDef)) {
    siblingUniqueAttributes = getAttributesUniqueSibling({
      record,
      attribute: node,
      attributeDef: nodeDef,
    })
  }
  return ObjectUtils.toUuidIndexedObj(siblingUniqueAttributes)
}
