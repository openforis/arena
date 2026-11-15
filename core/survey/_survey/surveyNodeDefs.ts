import * as A from '@core/arena'

import { Objects, Queue, Surveys, TraverseMethod } from '@openforis/arena-core'
import type {
  Category as ArenaCategory,
  NodeDef as ArenaNodeDef,
  NodeDefCode,
  NodeDefEntity,
  NodeDefType,
  Survey,
} from '@openforis/arena-core'

import { ArrayUtils } from '@core/arrayUtils'
import * as ObjectUtils from '@core/objectUtils'

import * as NodeDef from '../nodeDef'
import * as NodeDefLayout from '../nodeDefLayout'
import * as NodeDefValidations from '../nodeDefValidations'
import * as Category from '../category'
import * as SurveyInfo from './surveyInfo'
import * as SurveyNodeDefsIndex from './surveyNodeDefsIndex'
import { UniqueNameGenerator } from '@core/uniqueNameGenerator'

type AnyNodeDef = ArenaNodeDef<NodeDefType>
type NodeDefsByUuid = Record<string, AnyNodeDef>
type NodeDefPredicate = (nodeDef: AnyNodeDef) => boolean
type NodeDefVisitor = (nodeDef: AnyNodeDef) => void
type SurveyUpdater = (survey: Survey) => Survey

export type NodeDefHierarchyItem = AnyNodeDef & { children: NodeDefHierarchyItem[] }

const nodeDefsKey = 'nodeDefs'

// ====== READ
export const getNodeDefs = (survey: Survey): NodeDefsByUuid => A.propOr({}, nodeDefsKey)(survey) as NodeDefsByUuid

export const getNodeDefsArray = (survey: Survey): AnyNodeDef[] => Object.values(getNodeDefs(survey))

export const getNodeDefRoot = (survey: Survey): NodeDefEntity => Surveys.getNodeDefRoot({ survey })

export const getQualifierNodeDefs = (survey: Survey): AnyNodeDef[] => Surveys.getQualifierDefs({ survey })

export const getNodeDefByUuid =
  (uuid: string | null | undefined) =>
  (survey: Survey): AnyNodeDef | null =>
    A.propOr(null, uuid)(getNodeDefs(survey)) as AnyNodeDef | null

export const getNodeDefsByUuids =
  (uuids: string[] = []) =>
  (survey: Survey): AnyNodeDef[] =>
    // do not throw error if node defs are missing
    Surveys.findNodeDefsByUuids({ survey, uuids })

// Note: returns a survey getter, not the source node def itself (null if the node def is not virtual).
export const getNodeDefSource = (nodeDef: AnyNodeDef): ((survey: Survey) => AnyNodeDef | null) | null =>
  NodeDef.isVirtual(nodeDef) ? getNodeDefByUuid(NodeDef.getParentUuid(nodeDef)) : null

const filterNodeDefsWithoutSiblings = (nodeDefs: AnyNodeDef[]): AnyNodeDef[] => {
  const analysisDefsByChainUuid = ObjectUtils.groupByProp(NodeDef.getChainUuid)(
    nodeDefs.filter(NodeDef.isAnalysis)
  ) as Record<string, AnyNodeDef[]>
  return nodeDefs.filter(
    (nodeDef) => !NodeDef.isSampling(nodeDef) || analysisDefsByChainUuid[NodeDef.getChainUuid(nodeDef)]?.length > 1
  )
}

/**
 * Returns the child definitions of a node definition.
 * @param params - The parameters.
 * @param params.nodeDef - The parent node definition.
 * @param params.includeAnalysis - True to include analysis definitions.
 * @param params.includeLayoutElements - True to include layout elements.
 * @param params.includeSamplingDefsWithoutSiblings - True to keep sampling definitions without siblings.
 * @returns Function that returns the child definitions of the specified survey.
 */
export const getNodeDefChildren =
  ({
    nodeDef,
    includeAnalysis = true,
    includeLayoutElements = false,
    includeSamplingDefsWithoutSiblings = false,
  }: {
    nodeDef?: AnyNodeDef
    includeAnalysis?: boolean
    includeLayoutElements?: boolean
    includeSamplingDefsWithoutSiblings?: boolean
  } = {}) =>
  (survey: Survey): AnyNodeDef[] => {
    const surveyIndexed = survey.nodeDefsIndex ? survey : SurveyNodeDefsIndex.initAndAssocNodeDefsIndex(survey)
    let childDefs = Surveys.getNodeDefChildren({
      survey: surveyIndexed,
      nodeDef,
      includeAnalysis,
      includeLayoutElements,
    })
    if (!includeSamplingDefsWithoutSiblings) {
      childDefs = filterNodeDefsWithoutSiblings(childDefs)
    }
    return childDefs
  }

// adds the child defs of a cycle not already included, keeping their position
const mergeChildDefsOfCycle = (childDefs: AnyNodeDef[], childDefsInCycle: AnyNodeDef[]): void => {
  for (let index = 0; index < childDefsInCycle.length; index++) {
    const childDef = childDefsInCycle[index]
    if (!childDefs.includes(childDef)) {
      childDefs.splice(index, 0, childDef)
    }
  }
}

export const getNodeDefChildrenSorted =
  ({
    nodeDef,
    includeAnalysis = false,
    cycle = null,
    includeLayoutElements = false,
    includeSamplingDefsWithoutSiblings = false,
  }: {
    nodeDef: AnyNodeDef
    includeAnalysis?: boolean
    cycle?: string | null
    includeLayoutElements?: boolean
    includeSamplingDefsWithoutSiblings?: boolean
  }) =>
  (survey: Survey): AnyNodeDef[] => {
    const cycleKeysToConsider = Objects.isEmpty(cycle) ? Surveys.getCycleKeys(survey) : [cycle]
    // get child defs from the cycles to consider, then combine them keeping their sorting
    let childDefs: AnyNodeDef[] = []
    for (let cycleIndex = 0; cycleIndex < cycleKeysToConsider.length; cycleIndex++) {
      const currentCycle = cycleKeysToConsider[cycleIndex]
      const childDefsInCycle = Surveys.getNodeDefChildrenSorted({
        survey,
        cycle: currentCycle,
        nodeDef,
        includeAnalysis,
        includeLayoutElements,
      })
      if (cycleIndex === 0) {
        childDefs.push(...childDefsInCycle)
      } else {
        mergeChildDefsOfCycle(childDefs, childDefsInCycle)
      }
    }
    if (!includeSamplingDefsWithoutSiblings) {
      childDefs = filterNodeDefsWithoutSiblings(childDefs)
    }
    return childDefs
  }

export const getNodeDefChildrenInOwnPage =
  ({
    nodeDef,
    cycle,
    includeAnalysis = true,
    includeLayoutElements = false,
  }: {
    nodeDef: AnyNodeDef
    cycle: string
    includeAnalysis?: boolean
    includeLayoutElements?: boolean
  }) =>
  (survey: Survey): AnyNodeDef[] => {
    const children = getNodeDefChildren({ nodeDef, includeAnalysis, includeLayoutElements })(survey)
    const childrenInOwnPage = children.filter(NodeDefLayout.hasPage(cycle))
    const childrenIndex: string[] = NodeDefLayout.getIndexChildren(cycle)(nodeDef)
    if (childrenIndex.length === 0) return childrenInOwnPage

    // sort children following order in layout children index
    childrenInOwnPage.sort((childA, childB) => {
      const positionInIndexA = childrenIndex.indexOf(childA.uuid)
      const positionInIndexB = childrenIndex.indexOf(childB.uuid)
      if (positionInIndexA >= 0 && positionInIndexB >= 0) return positionInIndexA - positionInIndexB
      if (positionInIndexA < 0) return -1
      if (positionInIndexB < 0) return 1
      // otherwise keep creation order
      return childA.id - childB.id
    })
    return childrenInOwnPage
  }

// analysis node defs at the end, otherwise keep the previous order
const sortAnalysisDefsLast = (nodeDefs: AnyNodeDef[]): AnyNodeDef[] =>
  [...nodeDefs].sort((nodeDef1, nodeDef2) => {
    const isAnalysis1 = NodeDef.isAnalysis(nodeDef1)
    const isAnalysis2 = NodeDef.isAnalysis(nodeDef2)
    if (isAnalysis1 === isAnalysis2) {
      return nodeDefs.indexOf(nodeDef1) - nodeDefs.indexOf(nodeDef2)
    }
    return isAnalysis1 && !isAnalysis2 ? 1 : -1
  })

type DescendantsInSingleEntitiesParams = {
  nodeDef: AnyNodeDef
  includeAnalysis?: boolean
  filterFn?: NodeDefPredicate
  sorted?: boolean
  cycle?: string | null
  includeSamplingDefsWithoutSiblings?: boolean
}

export const getNodeDefDescendantsInSingleEntities =
  ({
    nodeDef,
    includeAnalysis,
    filterFn,
    sorted = false,
    cycle = null,
    includeSamplingDefsWithoutSiblings = false,
  }: DescendantsInSingleEntitiesParams) =>
  (survey: Survey): AnyNodeDef[] => {
    const descendants: AnyNodeDef[] = []

    const queue = new Queue()
    queue.enqueue(nodeDef)

    while (!queue.isEmpty()) {
      const entityDefCurrent = queue.dequeue()
      const entityDefCurrentChildren = sorted
        ? getNodeDefChildrenSorted({
            nodeDef: entityDefCurrent,
            includeAnalysis,
            cycle,
            includeSamplingDefsWithoutSiblings,
          })(survey)
        : getNodeDefChildren({ nodeDef: entityDefCurrent, includeAnalysis, includeSamplingDefsWithoutSiblings })(survey)

      descendants.push(...(filterFn ? entityDefCurrentChildren.filter(filterFn) : entityDefCurrentChildren))

      // visit nodes inside single entities
      queue.enqueueItems(entityDefCurrentChildren.filter(NodeDef.isSingleEntity))
    }
    return sorted ? sortAnalysisDefsLast(descendants) : descendants
  }

export const getNodeDefDescendantAttributesInSingleEntities = ({
  nodeDef,
  includeAnalysis = false,
  includeMultipleAttributes = false,
  sorted = false,
  cycle = null,
  includeSamplingDefsWithoutSiblings = true,
}: Omit<DescendantsInSingleEntitiesParams, 'filterFn'> & { includeMultipleAttributes?: boolean }) =>
  getNodeDefDescendantsInSingleEntities({
    nodeDef,
    includeAnalysis,
    filterFn: includeMultipleAttributes ? NodeDef.isAttribute : NodeDef.isSingleAttribute,
    sorted,
    cycle,
    includeSamplingDefsWithoutSiblings,
  })

export const hasNodeDefChildrenEntities =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): boolean => {
    if (NodeDef.isAttribute(nodeDef)) {
      return false
    }
    return getNodeDefChildren({ nodeDef })(survey).some(NodeDef.isEntity)
  }

export const getNodeDefChildByName =
  (nodeDef: AnyNodeDef, childName: string) =>
  (survey: Survey): AnyNodeDef | undefined =>
    SurveyNodeDefsIndex.hasNodeDefsIndexByName(survey)
      ? Surveys.getNodeDefByName({ survey, name: childName })
      : getNodeDefChildren({ nodeDef })(survey).find((childDef) => childName === NodeDef.getName(childDef))

export const getNodeDefParent =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): AnyNodeDef | null => {
    if (NodeDef.isRoot(nodeDef)) return null
    const nodeDefParent = getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey)
    return NodeDef.isVirtual(nodeDef) ? getNodeDefParent(nodeDefParent)(survey) : nodeDefParent
  }

export const getNodeDefAreaBasedEstimate =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): AnyNodeDef | undefined =>
    getNodeDefsArray(survey).find((_nodeDef) => NodeDef.getAreaBasedEstimatedOf(_nodeDef) === NodeDef.getUuid(nodeDef))

export const getAreaBasedEstimatedOfNodeDef =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): AnyNodeDef | null =>
    getNodeDefByUuid(NodeDef.getAreaBasedEstimatedOf(nodeDef))(survey)

const _nodeDefKeysFilter = (nodeDef: AnyNodeDef): boolean => NodeDef.isKey(nodeDef) && !NodeDef.isDeleted(nodeDef)

export const getNodeDefKeys =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): AnyNodeDef[] =>
    getNodeDefDescendantAttributesInSingleEntities({ nodeDef })(survey).filter(_nodeDefKeysFilter)

export const getNodeDefKeysSorted =
  ({ nodeDef, cycle }: { nodeDef: AnyNodeDef; cycle?: string | null }) =>
  (survey: Survey): AnyNodeDef[] =>
    getNodeDefDescendantsInSingleEntities({ nodeDef, cycle, sorted: true })(survey).filter(_nodeDefKeysFilter)

export const getNodeDefRootKeys = (survey: Survey): AnyNodeDef[] => {
  const root = getNodeDefRoot(survey)
  return root ? getNodeDefKeys(root)(survey) : []
}

export const getNodeDefRootKeysSorted =
  ({ cycle }: { cycle?: string | null }) =>
  (survey: Survey): AnyNodeDef[] => {
    const root = getNodeDefRoot(survey)
    return root ? getNodeDefKeysSorted({ nodeDef: root, cycle })(survey) : []
  }

export const getSummaryDefs =
  ({ nodeDef, cycle }: { nodeDef: AnyNodeDef; cycle: string }) =>
  (survey: Survey): AnyNodeDef[] =>
    getNodeDefDescendantAttributesInSingleEntities({ nodeDef, cycle, sorted: true })(survey).filter((childDef) =>
      NodeDefLayout.isIncludedInMultipleEntitySummary(cycle)(childDef)
    )

export const getRootSummaryDefs =
  ({ cycle }: { cycle: string }) =>
  (survey: Survey): AnyNodeDef[] => {
    const root = getNodeDefRoot(survey)
    return root ? getSummaryDefs({ nodeDef: root, cycle })(survey) : []
  }

export const isNodeDefRootKey =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): boolean =>
    NodeDef.isKey(nodeDef) && NodeDef.isRoot(getNodeDefParent(nodeDef)(survey))

export const canNodeDefBeQualifier =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): boolean =>
    (NodeDef.isText(nodeDef) || NodeDef.isCode(nodeDef)) &&
    !NodeDef.isMultiple(nodeDef) &&
    NodeDef.isRoot(getNodeDefParent(nodeDef)(survey))

export const getNodeDefsRootUnique = (survey: Survey): AnyNodeDef[] => {
  const nodeDefRoot = getNodeDefRoot(survey)
  return getNodeDefChildren({ nodeDef: nodeDefRoot })(survey).filter(
    (nodeDef) =>
      NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef)) &&
      !NodeDef.isDeleted(nodeDef) &&
      NodeDef.isSingle(nodeDef)
  )
}

export const getNodeDefByName =
  (name: string) =>
  (survey: Survey): AnyNodeDef =>
    Surveys.getNodeDefByName({ survey, name })

export const getNodeDefsByCategoryUuid =
  (uuid: string) =>
  (survey: Survey): AnyNodeDef[] =>
    getNodeDefsArray(survey).filter(A.pathEq([NodeDef.keys.props, NodeDef.propKeys.categoryUuid], uuid))

export const getNodeDefsByTaxonomyUuid =
  (uuid: string) =>
  (survey: Survey): AnyNodeDef[] =>
    getNodeDefsArray(survey).filter(A.pathEq([NodeDef.keys.props, NodeDef.propKeys.taxonomyUuid], uuid))

export const findNodeDef =
  (predicate: NodeDefPredicate) =>
  (survey: Survey): AnyNodeDef | undefined =>
    getNodeDefsArray(survey).find(predicate)

export const findNodeDefByName =
  (name: string) =>
  (survey: Survey): AnyNodeDef | undefined =>
    Surveys.findNodeDefByName({ survey, name })

export const getNodeDefMaxDecimalDigits =
  (nodeDef: AnyNodeDef) =>
  (survey?: Survey | null): number => {
    const referenceNodeDef =
      survey && NodeDef.isAreaBasedEstimatedOf(nodeDef) ? getAreaBasedEstimatedOfNodeDef(nodeDef)(survey) : nodeDef
    return NodeDef.getMaxNumberDecimalDigits(referenceNodeDef)
  }

// ====== UPDATE

export const assocNodeDefs =
  (nodeDefs: NodeDefsByUuid): SurveyUpdater =>
  (survey) => {
    const surveyUpdated = A.assoc(nodeDefsKey, nodeDefs)(survey)
    return SurveyNodeDefsIndex.initAndAssocNodeDefsIndex(surveyUpdated)
  }

const updateNodeDefs =
  (updateFn: (nodeDefs: NodeDefsByUuid) => NodeDefsByUuid): SurveyUpdater =>
  (survey) => {
    const nodeDefsPrev = getNodeDefs(survey)
    const nodeDefsUpdated = updateFn(nodeDefsPrev)
    return assocNodeDefs(nodeDefsUpdated)(survey)
  }

export const assocNodeDef = (nodeDef: AnyNodeDef): SurveyUpdater =>
  updateNodeDefs(A.assoc(NodeDef.getUuid(nodeDef), nodeDef))

// merge the specified node defs with the ones already in the survey
export const mergeNodeDefs = (nodeDefs: NodeDefsByUuid): SurveyUpdater =>
  updateNodeDefs((nodeDefsPrev) => ({ ...nodeDefsPrev, ...nodeDefs }))

export const dissocNodeDef = (nodeDefUuid: string): SurveyUpdater => updateNodeDefs(A.dissoc(nodeDefUuid))

const updateClonedEntityDefLayout = ({
  clonedEntityDef,
  newUuidByOldUuid,
}: {
  clonedEntityDef: AnyNodeDef
  newUuidByOldUuid: Record<string, string>
}): AnyNodeDef => {
  const layout = NodeDef.getLayout(clonedEntityDef)
  const layoutUpdated: Record<string, any> = {}
  for (const [cycle, layoutCycle] of Object.entries(layout)) {
    if (!layoutCycle) {
      continue
    }
    const layoutChildren: any[] = layoutCycle[NodeDefLayout.keys.layoutChildren] || []
    const updatedLayoutChildren = layoutChildren.map((item) => {
      if (typeof item === 'string') {
        return newUuidByOldUuid[item]
      }
      return {
        ...item,
        i: newUuidByOldUuid[item.i] || item.i,
      }
    })
    layoutUpdated[cycle] = {
      ...layoutCycle,
      [NodeDefLayout.keys.layoutChildren]: updatedLayoutChildren,
    }
  }
  return NodeDef.assocLayout(layoutUpdated)(clonedEntityDef)
}

export const cloneNodeDef =
  ({
    nodeDefUuid,
    targetParentNodeDefUuid,
    ignoreDefaultValues = true,
    ignoreApplicability = true,
    ignoreValidations = true,
    existingNodeDefNames: existingNodeDefNamesParam = null,
  }: {
    nodeDefUuid: string
    targetParentNodeDefUuid: string
    ignoreDefaultValues?: boolean
    ignoreApplicability?: boolean
    ignoreValidations?: boolean
    existingNodeDefNames?: string[] | null
  }) =>
  (survey: Survey): { clonedNodeDefs: AnyNodeDef[]; rootClonedNodeDef: AnyNodeDef } => {
    const nodeDef = getNodeDefByUuid(nodeDefUuid)(survey)
    const nodeDefParent = getNodeDefByUuid(targetParentNodeDefUuid)(survey)
    const existingNodeDefNames = existingNodeDefNamesParam ?? getNodeDefsArray(survey).map((nd) => NodeDef.getName(nd))

    // Gather all descendants (including nested entities)
    const nodeDefDescendants = getNodeDefDescendants({ nodeDef })(survey)

    const newUuidByOldUuid: Record<string, string> = {}
    const clonedNodeDefsByNewUuid: NodeDefsByUuid = {}
    const usedNames = new Set(existingNodeDefNames)

    // Helper to generate a unique name and track it
    const getUniqueName = (baseName: string): string => {
      const uniqueName = UniqueNameGenerator.generateUniqueName({
        startingName: baseName,
        existingNames: usedNames,
      })
      usedNames.add(uniqueName)
      return uniqueName
    }

    // 1. Clone all nodeDefs (entity + descendants), assign new UUIDs and unique names
    const nodeDefsToClone = [nodeDef, ...nodeDefDescendants]
    for (const nd of nodeDefsToClone) {
      const isRoot = nd.uuid === nodeDef.uuid
      // clone descendants are visited in parent-first (BFS) order, so the cloned parent is already available
      const clonedNodeDefParent = isRoot
        ? nodeDefParent
        : clonedNodeDefsByNewUuid[newUuidByOldUuid[NodeDef.getParentUuid(nd)]]
      const clonedName = getUniqueName(NodeDef.getName(nd))
      const cloned = NodeDef.cloneIntoEntityDef({
        nodeDefParent: clonedNodeDefParent,
        clonedNodeDefName: clonedName,
        ignoreDefaultValues,
        ignoreApplicability,
        ignoreValidations,
      })(nd)
      newUuidByOldUuid[nd.uuid] = cloned.uuid
      clonedNodeDefsByNewUuid[cloned.uuid] = cloned
    }
    //  Update layout props in all cloned entities to reference new UUIDs
    const clonedEntityDefs = Object.values(clonedNodeDefsByNewUuid).filter((nd) => NodeDef.isEntity(nd))
    for (const clonedEntityDef of clonedEntityDefs) {
      const clonedNodeDefUpdated = updateClonedEntityDefLayout({ clonedEntityDef, newUuidByOldUuid })
      clonedNodeDefsByNewUuid[clonedEntityDef.uuid] = clonedNodeDefUpdated
    }
    const clonedNodeDefs = Object.values(clonedNodeDefsByNewUuid)
    const rootClonedNodeDef = clonedNodeDefsByNewUuid[newUuidByOldUuid[nodeDef.uuid]]

    return { clonedNodeDefs, rootClonedNodeDef }
  }

// ====== HIERARCHY

export const findAncestors =
  ({
    nodeDef,
    predicate,
    visitorFn,
    includeSelf = true,
    stopAtFirstFound = false,
  }: {
    nodeDef: AnyNodeDef
    predicate?: NodeDefPredicate
    visitorFn?: NodeDefVisitor
    includeSelf?: boolean
    stopAtFirstFound?: boolean
  }) =>
  (survey: Survey): AnyNodeDef[] => {
    const result: AnyNodeDef[] = []
    let nodeDefToVisit = includeSelf ? nodeDef : getNodeDefParent(nodeDef)(survey)
    while (nodeDefToVisit) {
      visitorFn?.(nodeDefToVisit)
      if (predicate?.(nodeDefToVisit)) {
        result.push(nodeDefToVisit)
        if (stopAtFirstFound) {
          return result
        }
      }
      nodeDefToVisit = getNodeDefParent(nodeDefToVisit)(survey)
    }
    return result
  }

export const findAncestor =
  ({ nodeDef, predicate }: { nodeDef: AnyNodeDef; predicate: NodeDefPredicate }) =>
  (survey: Survey): AnyNodeDef | undefined =>
    findAncestors({ nodeDef, predicate, includeSelf: false, stopAtFirstFound: true })(survey)[0]

export const visitAncestors =
  (nodeDef: AnyNodeDef, visitorFn: NodeDefVisitor, includeSelf = true) =>
  (survey: Survey): AnyNodeDef[] =>
    findAncestors({ nodeDef, visitorFn, includeSelf })(survey)

export const visitAncestorsAndSelf = (nodeDef: AnyNodeDef, visitorFn: NodeDefVisitor) =>
  visitAncestors(nodeDef, visitorFn, true)

export const isNodeDefAncestor =
  (nodeDefAncestor: AnyNodeDef, nodeDefDescendant: AnyNodeDef) =>
  (survey: Survey): boolean => {
    if (NodeDef.isRoot(nodeDefDescendant)) {
      return false
    }
    const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
    return NodeDef.getUuid(nodeDefParent) === NodeDef.getUuid(nodeDefAncestor)
      ? true
      : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

export const getNodeDefAncestorMultipleEntity =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): AnyNodeDef | null => {
    let nodeDefCurrent = nodeDef
    do {
      nodeDefCurrent = getNodeDefParent(nodeDefCurrent)(survey)
    } while (nodeDefCurrent && !NodeDef.isRoot(nodeDefCurrent) && !NodeDef.isMultipleEntity(nodeDefCurrent))
    return nodeDefCurrent
  }

export const getNodeDefAncestorsKeyAttributes =
  (nodeDef: AnyNodeDef, includeSelf = false) =>
  (survey: Survey): AnyNodeDef[] => {
    let ancestorsKeyAttributes: AnyNodeDef[] = []
    visitAncestors(
      nodeDef,
      (ancestorDef) => {
        const ancestorKeyAttributes = getNodeDefKeys(ancestorDef)(survey)
        ancestorsKeyAttributes = [...ancestorKeyAttributes, ...ancestorsKeyAttributes]
      },
      includeSelf
    )(survey)

    return ancestorsKeyAttributes
  }

export const getNodeDefAncestorsKeyAttributesByAncestorUuid =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): Record<string, AnyNodeDef[]> => {
    const ancestorsKeyAttributesIndexed: Record<string, AnyNodeDef[]> = {}
    visitAncestors(nodeDef, (ancestorDef) => {
      const ancestorKeyAttributes = getNodeDefKeys(ancestorDef)(survey)
      ancestorsKeyAttributesIndexed[NodeDef.getUuid(ancestorDef)] = ancestorKeyAttributes
    })(survey)
    return ancestorsKeyAttributesIndexed
  }

export const getNodeDefPath =
  ({
    nodeDef,
    showLabels = false,
    labelLang = null,
    includeRootEntity = true,
    separator = ' / ',
  }: {
    nodeDef: AnyNodeDef
    showLabels?: boolean
    labelLang?: string | null
    includeRootEntity?: boolean
    separator?: string
  }) =>
  (survey: Survey): string => {
    const pathParts: string[] = []

    visitAncestorsAndSelf(nodeDef, (currentNodeDef) => {
      if (!includeRootEntity && NodeDef.isRoot(currentNodeDef)) return
      const pathPart = showLabels ? NodeDef.getLabel(currentNodeDef, labelLang) : NodeDef.getName(currentNodeDef)
      pathParts.unshift(pathPart)
    })(survey)

    return pathParts.join(separator)
  }

export const getHierarchy =
  (filterFn: NodeDefPredicate = NodeDef.isEntity, cycle: string | undefined = undefined) =>
  (survey: Survey): { root: NodeDefHierarchyItem; length: number } => {
    let length = 1
    const h = (array: NodeDefHierarchyItem[], nodeDef: AnyNodeDef): NodeDefHierarchyItem[] => {
      const childDefs: AnyNodeDef[] = []
      if (NodeDef.isEntity(nodeDef) && !NodeDef.isVirtual(nodeDef)) {
        const childDefsNotFiltered = cycle
          ? getNodeDefChildrenSorted({ nodeDef, cycle })(survey)
          : getNodeDefChildren({ nodeDef })(survey)
        childDefs.push(...childDefsNotFiltered.filter(filterFn))
      }
      length += childDefs.length
      const item = { ...nodeDef, children: childDefs.reduce((acc, childDef) => h(acc, childDef), []) }
      array.push(item)
      return array
    }

    return { root: h([], getNodeDefRoot(survey))[0], length }
  }

type HierarchyItemVisitor<R> = (item: NodeDefHierarchyItem, depth: number) => R

export const traverseHierarchyItem = async (
  nodeDefItem: NodeDefHierarchyItem,
  visitorFn: HierarchyItemVisitor<unknown>,
  depth = 0
): Promise<void> => {
  await visitorFn(nodeDefItem, depth)
  const children: NodeDefHierarchyItem[] = A.propOr([], 'children', nodeDefItem)
  for (const child of children) {
    await traverseHierarchyItem(child, visitorFn, depth + 1) // NOSONAR
  }
}

export const traverseHierarchyItemSync = (
  nodeDefItem: NodeDefHierarchyItem,
  visitorFn: HierarchyItemVisitor<void>,
  depth = 0
): void => {
  visitorFn(nodeDefItem, depth)
  const children: NodeDefHierarchyItem[] = A.propOr([], 'children', nodeDefItem)
  for (const child of children) {
    traverseHierarchyItemSync(child, visitorFn, depth + 1)
  }
}

type VisitDescendantsParams = {
  nodeDef?: AnyNodeDef | null
  cycle?: string | null
  traverseMethod?: TraverseMethod
}

export const visitDescendantsAndSelf =
  ({
    nodeDef = null,
    cycle = null,
    visitorFn,
    traverseMethod = TraverseMethod.bfs,
  }: VisitDescendantsParams & { visitorFn: NodeDefVisitor }) =>
  (survey: Survey): void => {
    const nodeDefToVisit = nodeDef ?? getNodeDefRoot(survey)
    return Surveys.visitDescendantsAndSelfNodeDef({
      survey,
      cycle,
      nodeDef: nodeDefToVisit,
      visitor: visitorFn,
      traverseMethod,
    })
  }

export const findDescendants =
  ({
    nodeDef = null,
    cycle = null,
    filterFn,
  }: Omit<VisitDescendantsParams, 'traverseMethod'> & { filterFn: NodeDefPredicate }) =>
  (survey: Survey): AnyNodeDef[] => {
    const descendants: AnyNodeDef[] = []
    visitDescendantsAndSelf({
      nodeDef,
      cycle,
      visitorFn: (nodeDefCurrent) => {
        if (filterFn(nodeDefCurrent)) {
          descendants.push(nodeDefCurrent)
        }
      },
    })(survey)
    return descendants
  }

export const getNodeDefDescendantsAndSelf =
  ({ nodeDef = null, cycle = null, traverseMethod = TraverseMethod.bfs }: VisitDescendantsParams = {}) =>
  (survey: Survey): AnyNodeDef[] => {
    const descendants: AnyNodeDef[] = []
    visitDescendantsAndSelf({
      nodeDef,
      cycle,
      visitorFn: (visitedNodeDef) => {
        descendants.push(visitedNodeDef)
      },
      traverseMethod,
    })(survey)
    return descendants
  }

export const getNodeDefDescendants =
  ({ nodeDef = null, cycle = null, traverseMethod = TraverseMethod.bfs }: VisitDescendantsParams = {}) =>
  (survey: Survey): AnyNodeDef[] =>
    getNodeDefDescendantsAndSelf({ nodeDef, cycle, traverseMethod })(survey).filter(
      (descendant) => !NodeDef.isEqual(nodeDef)(descendant)
    )

// OLAP
const multipleEntityFilterFunction = (nodeDef: AnyNodeDef): boolean =>
  NodeDef.isRoot(nodeDef) || NodeDef.isMultipleEntity(nodeDef)

export const getOlapDataTableEntityDefs = (survey: Survey): AnyNodeDef[] =>
  ArrayUtils.sortById(findDescendants({ filterFn: multipleEntityFilterFunction })(survey)) as AnyNodeDef[]

// ====== NODE DEFS CODE UTILS
export const getNodeDefParentCode = (nodeDef: AnyNodeDef) => getNodeDefByUuid(NodeDef.getParentCodeDefUuid(nodeDef))

export const getNodeDefAncestorCodes =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): AnyNodeDef[] =>
    Surveys.getNodeDefAncestorCodes({ survey, nodeDef: nodeDef as NodeDefCode })

export const isNodeDefParentCode =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): boolean =>
    getNodeDefsArray(survey).some((def) => NodeDef.getParentCodeDefUuid(def) === NodeDef.getUuid(nodeDef))

export const getNodeDefCategoryLevelIndex =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): number => {
    const parentCodeNodeDef = getNodeDefParentCode(nodeDef)(survey)
    return parentCodeNodeDef ? 1 + getNodeDefCategoryLevelIndex(parentCodeNodeDef)(survey) : 0
  }

export const getNodeDefCodeCandidateParents =
  ({ nodeDef, category }: { nodeDef: AnyNodeDef; category: ArenaCategory }) =>
  (survey: Survey): AnyNodeDef[] => {
    if (!category || !nodeDef) {
      return []
    }
    const levelsLength = Category.getLevelsArray(category).length
    // single attributes with the same category, other than nodeDef itself, not at the leaf level
    const isCandidate = (childDef: AnyNodeDef): boolean =>
      !NodeDef.isMultiple(childDef) &&
      NodeDef.getCategoryUuid(childDef) === NodeDef.getCategoryUuid(nodeDef) &&
      !NodeDef.isEqual(childDef)(nodeDef) &&
      getNodeDefCategoryLevelIndex(childDef)(survey) !== levelsLength - 1

    const candidates: AnyNodeDef[] = []
    visitAncestorsAndSelf(nodeDef, (nodeDefAncestor) => {
      if (!NodeDef.isEqual(nodeDefAncestor)(nodeDef)) {
        candidates.push(...getNodeDefChildren({ nodeDef: nodeDefAncestor })(survey).filter(isCandidate))
      }
    })(survey)
    return candidates
  }

export const canUpdateCategory =
  (nodeDef: AnyNodeDef) =>
  (survey: Survey): boolean =>
    (!NodeDef.isPublished(nodeDef) || SurveyInfo.isTemplate(SurveyInfo.getInfo(survey))) &&
    !isNodeDefParentCode(nodeDef)(survey)
