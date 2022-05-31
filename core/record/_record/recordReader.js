import * as R from 'ramda'

import { Records } from '@openforis/arena-core'

import Queue from '@core/queue'

import * as SurveyNodeDefs from '@core/survey/_survey/surveyNodeDefs'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as ObjectUtils from '@core/objectUtils'
import * as Node from '../node'
import { NodeValues } from '../nodeValues'

import { keys } from './recordKeys'

/**
 * === simple getters
 */
export const getNodes = R.propOr({}, keys.nodes)

export const getNodeByUuid = (uuid) => (record) => Records.getNodeByUuid(uuid)(record)

export const getRootNode = (record) => Records.getRoot(record)

export const getNodesByDefUuid = (nodeDefUuid) => (record) => Records.getNodesByDefUuid(nodeDefUuid)(record)

/**
 * ==== hierarchy
 */
// ancestors
export const getParentNode = (node) => (record) => Records.getParent(node)(record)

export const visitAncestorsAndSelf =
  ({ node, visitor }) =>
  (record) =>
    Records.visitAncestorsAndSelf(node, visitor)(record)

/**
 * Returns the list of ancestors from the given node to the root entity
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
export const getNodeChildren = (node) => (record) => Records.getChildren(node)(record)

export const getNodeChildrenByDefUuidUnsorted = (parentNode, nodeDefUuid) => (record) =>
  Records.getChildren(parentNode, nodeDefUuid)(record)

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

/**
 * Finds a the parent node of the specified node def, starting from the specified parent node and traversing
 * the single entities, if any, down to the correct parent node.
 */
export const getNodeParentInDescendantSingleEntities =
  ({ survey, parentNode, nodeDefUuid }) =>
  (record) => {
    const nodeDefParent = SurveyNodeDefs.getNodeDefByUuid(Node.getNodeDefUuid(parentNode))(survey)
    const nodeDef = SurveyNodeDefs.getNodeDefByUuid(nodeDefUuid)(survey)
    if (!NodeDef.isDescendantOf(nodeDefParent)(nodeDef)) {
      throw new Error('target node is not a descendant of the specified parent entity')
    }
    const nodeDefHierarchy = NodeDef.getMetaHierarchy(nodeDef)
    const nodeDefParentHierarchy = NodeDef.getMetaHierarchy(nodeDefParent)
    const hierarchyToVisit =
      nodeDefHierarchy.length > nodeDefParentHierarchy.length + 1
        ? nodeDefHierarchy.slice(nodeDefParentHierarchy.length + 1)
        : []

    let currentParentNode = parentNode

    hierarchyToVisit.forEach((descendantDefUuid) => {
      const nodeDefDescendant = SurveyNodeDefs.getNodeDefByUuid(descendantDefUuid)(survey)
      if (NodeDef.isSingleEntity(nodeDefDescendant)) {
        currentParentNode = getNodeChildByDefUuid(currentParentNode, descendantDefUuid)(record)
      } else {
        throw new Error(
          `the target node ${NodeDef.getName(nodeDef)} is inside a multiple entity: ${NodeDef.getName(
            nodeDefDescendant
          )}`
        )
      }
    })
    return currentParentNode
  }

/**
 * Returns true if a node and all its ancestors are applicable
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
export const getDependentNodePointers =
  (survey, node, dependencyType, includeSelf = false, filterFn = null) =>
  (record) =>
    Records.getDependentNodePointers({ survey, record, node, dependencyType, includeSelf, filterFn })

// Code attributes
export const getDependentCodeAttributes = (node) => (record) => Records.getDependentCodeAttributes(node)(record)

export const getParentCodeAttribute = (_survey, parentNode, nodeDef) => (record) =>
  Records.getParentCodeAttribute({ parentNode, nodeDef })(record)

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

export const findChildByKeyValues =
  ({ survey, parentNode, childDefUuid, keyValuesByDefUuid }) =>
  (record) => {
    const childDef = SurveyNodeDefs.getNodeDefByUuid(childDefUuid)(survey)
    const siblings = getNodeChildrenByDefUuidUnsorted(parentNode, childDefUuid)(record)
    return siblings.find((sibling) => {
      if (NodeDef.isSingleEntity(childDef)) {
        return sibling
      }
      const keyDefs = SurveyNodeDefs.getNodeDefKeys(childDef)(survey)
      return keyDefs.every((keyDef) => {
        const keyDefUuid = NodeDef.getUuid(keyDef)
        const keyAttribute = getNodeChildByDefUuid(sibling, keyDefUuid)(record)
        const keyAttributeValue = Node.getValue(keyAttribute)
        const keyAttributeValueSearch = keyValuesByDefUuid[keyDefUuid]

        return NodeValues.isValueEqual({
          survey,
          nodeDef: keyDef,
          record,
          parentNode: sibling,
          value: keyAttributeValue,
          valueSearch: keyAttributeValueSearch,
        })
      })
    })
  }

export const findDescendantByKeyValues =
  ({ survey, descendantDefUuid, keyValuesByDefUuid }) =>
  (record) => {
    // start from root node
    const rootNode = getRootNode(record)
    if (NodeDef.getUuid(SurveyNodeDefs.getNodeDefRoot(survey)) === descendantDefUuid) {
      // the descendant is the root entity
      return rootNode
    }
    let currentNode = rootNode
    // visit descendant nodes up to descendant def (excluding root entity)
    const entityDef = SurveyNodeDefs.getNodeDefByUuid(descendantDefUuid)(survey)
    const hierarchyToVisit = [...NodeDef.getMetaHierarchy(entityDef), descendantDefUuid]
    hierarchyToVisit.shift()
    hierarchyToVisit.some((nodeDefUuid) => {
      const descendant = findChildByKeyValues({
        survey,
        parentNode: currentNode,
        childDefUuid: nodeDefUuid,
        keyValuesByDefUuid,
      })(record)

      if (!descendant) {
        currentNode = null
        return false // break the loop
      }
      currentNode = descendant
    })
    return currentNode
  }

// ===== Unique

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
