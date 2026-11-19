import { RecordNodes, Queue, Records } from '@openforis/arena-core'
import type {
  ArenaRecord,
  ArenaRecordNode,
  ArenaNodeDef,
  ArenaNodeDefCode,
  NodeDefType,
  ArenaRecordNodePointer,
  ArenaSurvey,
  SurveyDependencyType,
} from '@openforis/arena-core'

import * as A from '@core/arena'

import * as SurveyNodeDefs from '@core/survey/_survey/surveyNodeDefs'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as ObjectUtils from '@core/objectUtils'
import * as Node from '../node'
import { NodeValues } from '../nodeValues'

import { keys } from './recordKeys'
import { EntityKeysIndexCache } from './entityKeysIndexCache'

type AnyNodeDef = ArenaNodeDef<NodeDefType>
type NodeVisitor = (node: ArenaRecordNode) => void
type NodePredicate = (node: ArenaRecordNode) => boolean

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
export const getNodes = (record: ArenaRecord): Record<string, ArenaRecordNode> =>
  A.propOr({}, keys.nodes)(record) as Record<string, ArenaRecordNode>
export const getNodesArray = (record: ArenaRecord): ArenaRecordNode[] => Object.values(getNodes(record))

export { getNodeChildren, getNodeByUuid, getNodesByDefUuid, getRootNode, getParentNode }

export const findNodeChildren =
  (parentNode: ArenaRecordNode, childDefUuid?: string) =>
  (record: ArenaRecord): ArenaRecordNode[] => {
    try {
      return getNodeChildren(parentNode, childDefUuid)(record)
    } catch {
      return []
    }
  }

// ==== hierarchy
// ancestors

export const visitAncestorsAndSelf =
  (node: ArenaRecordNode, visitor: NodeVisitor) =>
  (record: ArenaRecord): void =>
    // the visitor return value is ignored: the visit never stops early
    Records.visitAncestorsAndSelf(node, (visitedNode) => {
      visitor(visitedNode)
    })(record)

/**
 * Returns the list of ancestors from the given node to the root entity.
 * @param node - The node to start from.
 * @returns Function taking the record and returning the node and its ancestors.
 */
export const getAncestorsAndSelf =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): ArenaRecordNode[] =>
    Records.getAncestorsAndSelf(node)(record)

export const getAncestorByNodeDefUuid =
  (node: ArenaRecordNode, ancestorDefUuid: string) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    const parentNode = getParentNode(node)(record)
    return getAncestorsAndSelf(parentNode)(record).find((ancestor) => Node.getNodeDefUuid(ancestor) === ancestorDefUuid)
  }

// Descendants
export const getNodeChildrenByDefUuidUnsorted =
  (parentNode: ArenaRecordNode, nodeDefUuid: string) =>
  (record: ArenaRecord): ArenaRecordNode[] =>
    getNodeChildren(parentNode, nodeDefUuid)(record)

// placeholders last, then by id or creation date
const compareChildren = (node1: ArenaRecordNode, node2: ArenaRecordNode): number => {
  if (Node.isPlaceholder(node1) && !Node.isPlaceholder(node2)) return 1
  if (!Node.isPlaceholder(node1) && Node.isPlaceholder(node2)) return -1
  if (node1.id < node2.id || node1.dateCreated < node2.dateCreated) return -1
  if (node1.id > node2.id || node1.dateCreated > node2.dateCreated) return 1
  return 0
}

export const getNodeChildrenByDefUuid =
  (parentNode: ArenaRecordNode, nodeDefUuid: string) =>
  (record: ArenaRecord): ArenaRecordNode[] =>
    getNodeChildrenByDefUuidUnsorted(parentNode, nodeDefUuid)(record).sort(compareChildren)

export const getNodeChildByDefUuid =
  (parentNode: ArenaRecordNode, nodeDefUuid: string) =>
  (record: ArenaRecord): ArenaRecordNode | undefined =>
    getNodeChildrenByDefUuid(parentNode, nodeDefUuid)(record)[0]

export const getNodeChildIndex =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): number => {
    const parentNode = getParentNode(node)(record)
    const siblings = getNodeChildrenByDefUuid(parentNode, Node.getNodeDefUuid(node))(record)
    return siblings.findIndex((sibling) => Node.isEqual(sibling)(node))
  }

export const visitDescendantsAndSelf =
  (node: ArenaRecordNode, visitor: NodeVisitor, stopIfFn: NodePredicate | null = null) =>
  (record: ArenaRecord): void => {
    const queue = new Queue()

    queue.enqueue(node)

    while (!queue.isEmpty()) {
      const visitedNode: ArenaRecordNode = queue.dequeue()

      visitor(visitedNode)

      if (stopIfFn?.(visitedNode)) {
        break
      }
      const children = getNodeChildren(visitedNode)(record)
      queue.enqueueItems(children)
    }
  }

export const findDescendantOrSelf =
  (node: ArenaRecordNode, filterFn: NodePredicate) =>
  (record: ArenaRecord): ArenaRecordNode | null => {
    let found: ArenaRecordNode | null = null
    visitDescendantsAndSelf(
      node,
      (currentNode) => {
        if (filterFn(currentNode)) found = currentNode
      },
      () => found !== null
    )(record)
    return found
  }

/**
 * Finds the parent node of the specified node def, starting from the specified parent node and traversing
 * the single entities, if any, down to the correct parent node.
 * @param params - The parameters.
 * @param params.survey - The survey.
 * @param params.parentNode - The node to start from.
 * @param params.nodeDefUuid - The UUID of the node def whose parent node is searched.
 * @returns Function returning the parent node in the specified record.
 */
export const getNodeParentInDescendantSingleEntities =
  ({ survey, parentNode, nodeDefUuid }: { survey: ArenaSurvey; parentNode: ArenaRecordNode; nodeDefUuid: string }) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
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

    for (const descendantDefUuid of hierarchyToVisit) {
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
    }
    return currentParentNode
  }

/**
 * Returns true if a node and all its ancestors are applicable.
 * @param node - The node.
 * @returns Function returning true if the node is applicable in the specified record.
 */
// not delegated to Records.isNodeApplicable: a missing node is considered applicable here
export const isNodeApplicable =
  (node: ArenaRecordNode | null | undefined) =>
  (record: ArenaRecord): boolean => {
    if (Node.isRoot(node)) {
      return true
    }
    const nodeParent = getParentNode(node)(record)
    const isApplicable = Node.isChildApplicable(Node.getNodeDefUuid(node))(nodeParent)
    return isApplicable ? isNodeApplicable(nodeParent)(record) : false
  }

// ==== dependency
/**
 * Returns the dependent node pointers (each one in the format { nodeCtx, nodeDef }).
 * @param survey - The survey.
 * @param node - The node whose dependents are searched.
 * @param dependencyType - The dependency type.
 * @param includeSelf - True to include the node itself, if it depends on itself.
 * @param filterFn - Optional filter for the node pointers.
 * @returns Function returning the dependent node pointers in the specified record.
 */
export const getDependentNodePointers =
  (
    survey: ArenaSurvey,
    node: ArenaRecordNode,
    dependencyType: SurveyDependencyType | string,
    includeSelf = false,
    filterFn: ((nodePointer: ArenaRecordNodePointer) => boolean) | null = null
  ) =>
  (record: ArenaRecord): ArenaRecordNodePointer[] =>
    Records.getDependentNodePointers(
      survey,
      node,
      dependencyType as SurveyDependencyType,
      includeSelf,
      filterFn
    )(record)

// Code attributes
export const getDependentCodeAttributes =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): ArenaRecordNode[] =>
    Records.getDependentCodeAttributes(node)(record)

export const getParentCodeAttribute =
  (_survey: ArenaSurvey, parentNode: ArenaRecordNode, nodeDef: AnyNodeDef) =>
  (record: ArenaRecord): ArenaRecordNode | undefined =>
    Records.getParentCodeAttribute(parentNode, nodeDef as ArenaNodeDefCode)(record)

// Visits the ancestor code attributes in bottom-up order
export const visitAncestorCodeAttributes =
  ({
    survey,
    parentNode,
    nodeDef,
    visitor,
  }: {
    survey: ArenaSurvey
    parentNode: ArenaRecordNode
    nodeDef: AnyNodeDef
    visitor: NodeVisitor
  }) =>
  (record: ArenaRecord): void => {
    const visitedNodeUuids = new Set<string>() // avoid cycles
    let currentParentCodeAttribute = getParentCodeAttribute(survey, parentNode, nodeDef)(record)
    while (currentParentCodeAttribute && !visitedNodeUuids.has(Node.getUuid(currentParentCodeAttribute))) {
      visitedNodeUuids.add(Node.getUuid(currentParentCodeAttribute))
      visitor(currentParentCodeAttribute)
      const parentCodeAttributeNodeDef = SurveyNodeDefs.getNodeDefByUuid(
        Node.getNodeDefUuid(currentParentCodeAttribute)
      )(survey)
      const ancestorNode = Records.getParent(currentParentCodeAttribute)(record)
      currentParentCodeAttribute = getParentCodeAttribute(survey, ancestorNode, parentCodeAttributeNodeDef)(record)
    }
  }

// Returns the ancestor code attributes, in top-down order
export const getAncestorCodeAttributes =
  ({ survey, parentNode, nodeDef }: { survey: ArenaSurvey; parentNode: ArenaRecordNode; nodeDef: AnyNodeDef }) =>
  (record: ArenaRecord): ArenaRecordNode[] => {
    const result: ArenaRecordNode[] = []
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

// ====== Keys

export const getEntityKeyNodes =
  (survey: ArenaSurvey, nodeEntity: ArenaRecordNode) =>
  (record: ArenaRecord): ArenaRecordNode[] =>
    Records.getEntityKeyNodes(survey, nodeEntity)(record)

export const getEntityKeyValues =
  (survey: ArenaSurvey, nodeEntity: ArenaRecordNode) =>
  (record: ArenaRecord): unknown[] =>
    getEntityKeyNodes(survey, nodeEntity)(record).map((keyNode) => Node.getValue(keyNode))

type FindChildByKeyValuesParams = {
  survey: ArenaSurvey
  parentNode: ArenaRecordNode
  childDefUuid: string
  keyValuesByDefUuid: Record<string, unknown>
  entityKeysIndexCache?: EntityKeysIndexCache | null
}

export const findChildByKeyValues =
  ({ survey, parentNode, childDefUuid, keyValuesByDefUuid, entityKeysIndexCache = null }: FindChildByKeyValuesParams) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    const childDef = SurveyNodeDefs.getNodeDefByUuid(childDefUuid)(survey)
    const siblings = getNodeChildrenByDefUuidUnsorted(parentNode, childDefUuid)(record)
    if (NodeDef.isSingleEntity(childDef)) {
      return siblings[0]
    }
    // key defs are computed once (and not for every sibling): siblings can be many (e.g. when importing data)
    const applicableKeyDefs = SurveyNodeDefs.getNodeDefKeys(childDef)(survey).filter((keyDef) =>
      RecordNodes.isChildApplicable(parentNode, NodeDef.getUuid(keyDef))
    )
    const hasKeyValues = (entity: ArenaRecordNode): boolean =>
      applicableKeyDefs.every((keyDef) => {
        const keyDefUuid = NodeDef.getUuid(keyDef)
        const keyAttribute = getNodeChildByDefUuid(entity, keyDefUuid)(record)
        const keyAttributeValue = Node.getValue(keyAttribute)
        const keyAttributeValueSearch = keyValuesByDefUuid[keyDefUuid]

        return NodeValues.isValueEqual({
          survey,
          nodeDef: keyDef,
          record,
          parentNode: entity,
          attribute: keyAttribute,
          value: keyAttributeValue,
          valueSearch: keyAttributeValueSearch,
        })
      })

    if (entityKeysIndexCache && EntityKeysIndexCache.canBeUsed(applicableKeyDefs)) {
      const entityUuids = entityKeysIndexCache.findEntityUuids({
        parentNode,
        childDefUuid,
        keyDefs: applicableKeyDefs,
        siblings,
        getKeyAttribute: (entity, keyDefUuid) => getNodeChildByDefUuid(entity, keyDefUuid)(record),
        keyValuesByDefUuid,
      })
      if (entityUuids) {
        // entities found in the index are checked again: key values could have been modified after the index has been built
        return entityUuids
          .map((entityUuid) => getNodeByUuid(entityUuid)(record))
          .find((entity) => entity && !Node.isDeleted(entity) && hasKeyValues(entity))
      }
    }
    return siblings.find(hasKeyValues)
  }

export const findDescendantByKeyValues =
  ({
    survey,
    descendantDefUuid,
    keyValuesByDefUuid,
    entityKeysIndexCache = null,
  }: Omit<FindChildByKeyValuesParams, 'parentNode' | 'childDefUuid'> & { descendantDefUuid: string }) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
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
      currentNode = findChildByKeyValues({
        survey,
        parentNode: currentNode,
        childDefUuid: nodeDefUuid,
        keyValuesByDefUuid,
        entityKeysIndexCache,
      })(record)
    }
    return currentNode
  }

// ===== Unique

export const getAttributesUniqueSibling = ({
  record,
  attribute,
  attributeDef,
}: {
  record: ArenaRecord
  attribute: ArenaRecordNode
  attributeDef: AnyNodeDef
}): ArenaRecordNode[] => {
  const parentEntity = getParentNode(attribute)(record)
  const ancestorEntity = getParentNode(parentEntity)(record)
  const siblingParentEntities = getNodeChildrenByDefUuid(ancestorEntity, NodeDef.getParentUuid(attributeDef))(record)

  return siblingParentEntities.reduce(
    (siblingsAcc: ArenaRecordNode[], siblingEntity) => [
      ...siblingsAcc,
      ...getNodeChildrenByDefUuid(siblingEntity, NodeDef.getUuid(attributeDef))(record),
    ],
    []
  )
}

const _isNodeDefUnique = (nodeDef: AnyNodeDef): boolean => NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))

export const getAttributesUniqueDependent = ({
  survey,
  record,
  node,
}: {
  survey: ArenaSurvey
  record: ArenaRecord
  node: ArenaRecordNode
}): Record<string, ArenaRecordNode> => {
  const nodeDef = SurveyNodeDefs.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (NodeDef.isSingleEntity(nodeDef)) return {}

  let siblingUniqueAttributes: ArenaRecordNode[] = []
  if (NodeDef.isEntity(nodeDef)) {
    const nodeDefsUnique = SurveyNodeDefs.getNodeDefChildren({ nodeDef })(survey).filter(_isNodeDefUnique)

    siblingUniqueAttributes = nodeDefsUnique.reduce((siblingsAcc: ArenaRecordNode[], nodeDefUnique) => {
      if (NodeDef.isSingle(nodeDefUnique)) {
        const attribute = getNodeChildByDefUuid(node, NodeDef.getUuid(nodeDefUnique))(record)
        siblingsAcc.push(...getAttributesUniqueSibling({ record, attribute, attributeDef: nodeDefUnique }))
      }
      return siblingsAcc
    }, [])
  } else if (_isNodeDefUnique(nodeDef)) {
    siblingUniqueAttributes = getAttributesUniqueSibling({ record, attribute: node, attributeDef: nodeDef })
  }
  return ObjectUtils.toUuidIndexedObj(siblingUniqueAttributes)
}

export const isNodeFilledByUser =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): boolean =>
    Records.isNodeFilledByUser(node)(record)

export const isNodeEmpty =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): boolean =>
    Records.isNodeEmpty(node)(record)

export const isEmpty = (record: ArenaRecord): boolean => Records.isEmpty(record)
