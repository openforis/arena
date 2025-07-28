import * as R from 'ramda'

import { Nodes, Records } from '@openforis/arena-core'

import Queue from '@core/queue'

import * as SurveyNodeDefs from '@core/survey/_survey/surveyNodeDefs'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as ObjectUtils from '@core/objectUtils'
import * as Node from '../node'
import * as NodeRefData from '../nodeRefData'
import { NodeValues } from '../nodeValues'

import { keys } from './recordKeys'

const {
  getChildren: getNodeChildren,
  getNodeByUuid,
  getNodesByDefUuid,
  getParent: getParentNode,
  getRoot: getRootNode,
} = Records

/**
 * === simple getters.
 */
export const getNodes = R.propOr({}, keys.nodes)
export const getNodesArray = (record) => Object.values(getNodes(record))

export { getNodeChildren, getNodeByUuid, getNodesByDefUuid, getRootNode, getParentNode }

export const findNodeChildren = (parentNode, childDefUuid) => (record) => {
  try {
    return getNodeChildren(parentNode, childDefUuid)(record)
  } catch (error) {
    return []
  }
}

// ==== hierarchy
// ancestors

export const visitAncestorsAndSelf =
  ({ node, visitor }) =>
  (record) =>
    Records.visitAncestorsAndSelf(node, visitor)(record)

/**
 * Returns the list of ancestors from the given node to the root entity.
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
export const getNodeChildrenByDefUuidUnsorted = (parentNode, nodeDefUuid) => (record) =>
  getNodeChildren(parentNode, nodeDefUuid)(record)

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

export const getNodeChildIndex = (node) => (record) => {
  const parentNode = getParentNode(node)(record)
  const siblings = getNodeChildrenByDefUuid(parentNode, Node.getNodeDefUuid(node))(record)
  return siblings.findIndex((sibling) => Node.isEqual(sibling)(node))
}

export const visitDescendantsAndSelf =
  (node, visitor, stopIfFn = null) =>
  (record) => {
    const queue = new Queue()

    queue.enqueue(node)

    while (!queue.isEmpty()) {
      const node = queue.dequeue()

      visitor(node)

      if (stopIfFn && stopIfFn(node)) {
        break
      }
      const children = getNodeChildren(node)(record)
      queue.enqueueItems(children)
    }
  }

export const findDescendantOrSelf = (node, filterFn) => (record) => Records.findDescendantOrSelf(node, filterFn)(record)

/**
 * Finds a the parent node of the specified node def, starting from the specified parent node and traversing
 * the single entities, if any, down to the correct parent node.
 * @param root0
 * @param root0.survey
 * @param root0.parentNode
 * @param root0.nodeDefUuid
 */
export const getNodeParentInDescendantSingleEntities =
  ({ survey, parentNode, nodeDefUuid }) =>
  (record) => {
    const nodeDefParent = SurveyNodeDefs.getNodeDefByUuid(Node.getNodeDefUuid(parentNode))(survey)
    const nodeDef = SurveyNodeDefs.getNodeDefByUuid(nodeDefUuid)(survey)
    if (!NodeDef.isDescendantOf(nodeDefParent)(nodeDef)) {
      throw new Error(`target node is not a descendant of the specified parent entity:\
        parentNodeDef: ${NodeDef.getName(nodeDefParent)} descendantDef: ${NodeDef.getName(nodeDef)}`)
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
 * Returns true if a node and all its ancestors are applicable.
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

// ==== dependency
/**
 * Returns a list of dependent node pointers.
 * Every item in the list is in the format:
 * {
 *   nodeCtx, //context node
 *   nodeDef, //node definition
 * }.
 * @param survey
 * @param node
 * @param dependencyType
 * @param includeSelf
 * @param filterFn
 */
export const getDependentNodePointers =
  (survey, node, dependencyType, includeSelf = false, filterFn = null) =>
  (record) =>
    Records.getDependentNodePointers({ survey, record, node, dependencyType, includeSelf, filterFn })

// Code attributes
export const getDependentCodeAttributes = (node) => (record) => Records.getDependentCodeAttributes(node)(record)

export const getParentCodeAttribute = (_survey, parentNode, nodeDef) => (record) =>
  Records.getParentCodeAttribute({ parentNode, nodeDef })(record)

// Visits the ancestor code attributes in bottom-up order
export const visitAncestorCodeAttributes =
  ({ survey, parentNode, nodeDef, visitor }) =>
  (record) => {
    const visitedNodeUuids = new Set() // avoid cycles
    let currentParentCodeAttribute = Records.getParentCodeAttribute({ parentNode, nodeDef })(record)
    while (currentParentCodeAttribute && !visitedNodeUuids.has(Node.getUuid(currentParentCodeAttribute))) {
      visitedNodeUuids.add(Node.getUuid(currentParentCodeAttribute))
      visitor(currentParentCodeAttribute)
      const parentCodeAttributeNodeDef = SurveyNodeDefs.getNodeDefByUuid(
        Node.getNodeDefUuid(currentParentCodeAttribute)
      )(survey)
      const ancestorNode = Records.getParent(currentParentCodeAttribute)(record)
      currentParentCodeAttribute = Records.getParentCodeAttribute({
        parentNode: ancestorNode,
        nodeDef: parentCodeAttributeNodeDef,
      })(record)
    }
  }

// Returns the ancestor code attributes, in top-down order
export const getAncestorCodeAttributes =
  ({ survey, parentNode, nodeDef }) =>
  (record) => {
    const result = []
    visitAncestorCodeAttributes({
      survey,
      parentNode,
      nodeDef,
      visitor: (visitedCodeAttribute) => {
        result.unshift(visitedCodeAttribute)
      },
    })(record)
    return result
  }

const getNodeCategoryItemCode = (node) => {
  const item = NodeRefData.getCategoryItem(node)
  if (item) {
    return CategoryItem.getCode(item)
  }
  const value = Node.getValue(node)
  return NodeValues.getValueCode(value)
}

// Returns the ancestor code attribute codes, in top-down order
export const getAncestorCodeAttributeCodes =
  ({ survey, parentNode, nodeDef }) =>
  (record) => {
    const result = []
    visitAncestorCodeAttributes({
      survey,
      parentNode,
      nodeDef,
      visitor: (visitedCodeAttribute) => {
        const code = getNodeCategoryItemCode(visitedCodeAttribute)
        result.unshift(code)
      },
    })(record)
    return result
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
      return keyDefs
        .filter((keyDef) => Nodes.isChildApplicable(parentNode, NodeDef.getUuid(keyDef)))
        .every((keyDef) => {
          const keyDefUuid = NodeDef.getUuid(keyDef)
          const keyAttribute = getNodeChildByDefUuid(sibling, keyDefUuid)(record)
          const keyAttributeValue = Node.getValue(keyAttribute)
          const keyAttributeValueSearch = keyValuesByDefUuid[keyDefUuid]

          return NodeValues.isValueEqual({
            survey,
            nodeDef: keyDef,
            record,
            parentNode: sibling,
            attribute: keyAttribute,
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

    while (hierarchyToVisit.length && currentNode) {
      const nodeDefUuid = hierarchyToVisit.shift()
      const descendant = findChildByKeyValues({
        survey,
        parentNode: currentNode,
        childDefUuid: nodeDefUuid,
        keyValuesByDefUuid,
      })(record)

      currentNode = descendant
    }
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

export const isNodeFilledByUser = (node) => (record) => Records.isNodeFilledByUser(node)(record)

export const isNodeEmpty = (node) => (record) => Records.isNodeEmpty(node)(record)

export const isEmpty = (record) => Records.isEmpty(record)
