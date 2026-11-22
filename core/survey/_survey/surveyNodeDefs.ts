import * as A from '@core/arena'

import {
  Objects,
  Queue,
  Surveys,
  TraverseMethod,
  type ArenaCategory,
  type ArenaNodeDefCode,
  type ArenaNodeDefEntity,
  type ArenaSurvey,
  ArenaAnyNodeDef,
  type ArenaNodeDefMap,
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

type NodeDefPredicate = (nodeDef: ArenaAnyNodeDef) => boolean
type NodeDefVisitor = (nodeDef: ArenaAnyNodeDef) => void
type SurveyUpdater = (survey: ArenaSurvey) => ArenaSurvey

export type NodeDefHierarchyItem = ArenaAnyNodeDef & { children: NodeDefHierarchyItem[] }

const nodeDefsKey = 'nodeDefs'

// ====== READ
export const getNodeDefs = (survey: ArenaSurvey): ArenaNodeDefMap =>
  A.propOr({}, nodeDefsKey)(survey) as ArenaNodeDefMap

export const getNodeDefsArray = (survey: ArenaSurvey): ArenaAnyNodeDef[] => Object.values(getNodeDefs(survey))

export const getNodeDefRoot = (survey: ArenaSurvey): ArenaNodeDefEntity => Surveys.getNodeDefRoot({ survey })

export const getQualifierNodeDefs = (survey: ArenaSurvey): ArenaAnyNodeDef[] => Surveys.getQualifierDefs({ survey })

export const getNodeDefByUuid =
  (uuid: string | null | undefined) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef | null =>
    A.propOr(null, uuid)(getNodeDefs(survey)) as ArenaAnyNodeDef | null

export const getNodeDefsByUuids =
  (uuids: string[] = []) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    // do not throw error if node defs are missing
    Surveys.findNodeDefsByUuids({ survey, uuids })

// Note: returns a survey getter, not the source node def itself (null if the node def is not virtual).
export const getNodeDefSource = (nodeDef: ArenaAnyNodeDef): ((survey: ArenaSurvey) => ArenaAnyNodeDef | null) | null =>
  NodeDef.isVirtual(nodeDef) ? getNodeDefByUuid(NodeDef.getParentUuid(nodeDef)) : null

const filterNodeDefsWithoutSiblings = (nodeDefs: ArenaAnyNodeDef[]): ArenaAnyNodeDef[] => {
  const analysisDefsByChainUuid = ObjectUtils.groupByProp(NodeDef.getChainUuid)(
    nodeDefs.filter(NodeDef.isAnalysis)
  ) as Record<string, ArenaAnyNodeDef[]>
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
    nodeDef?: ArenaAnyNodeDef
    includeAnalysis?: boolean
    includeLayoutElements?: boolean
    includeSamplingDefsWithoutSiblings?: boolean
  } = {}) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
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
const mergeChildDefsOfCycle = (childDefs: ArenaAnyNodeDef[], childDefsInCycle: ArenaAnyNodeDef[]): void => {
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
    nodeDef: ArenaAnyNodeDef
    includeAnalysis?: boolean
    cycle?: string | null
    includeLayoutElements?: boolean
    includeSamplingDefsWithoutSiblings?: boolean
  }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    const cycleKeysToConsider = Objects.isEmpty(cycle) ? Surveys.getCycleKeys(survey) : [cycle]
    // get child defs from the cycles to consider, then combine them keeping their sorting
    let childDefs: ArenaAnyNodeDef[] = []
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
    nodeDef: ArenaAnyNodeDef
    cycle: string
    includeAnalysis?: boolean
    includeLayoutElements?: boolean
  }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
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
const sortAnalysisDefsLast = (nodeDefs: ArenaAnyNodeDef[]): ArenaAnyNodeDef[] =>
  [...nodeDefs].sort((nodeDef1, nodeDef2) => {
    const isAnalysis1 = NodeDef.isAnalysis(nodeDef1)
    const isAnalysis2 = NodeDef.isAnalysis(nodeDef2)
    if (isAnalysis1 === isAnalysis2) {
      return nodeDefs.indexOf(nodeDef1) - nodeDefs.indexOf(nodeDef2)
    }
    return isAnalysis1 && !isAnalysis2 ? 1 : -1
  })

type DescendantsInSingleEntitiesParams = {
  nodeDef: ArenaAnyNodeDef
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
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    const descendants: ArenaAnyNodeDef[] = []

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
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): boolean => {
    if (NodeDef.isAttribute(nodeDef)) {
      return false
    }
    return getNodeDefChildren({ nodeDef })(survey).some(NodeDef.isEntity)
  }

export const getNodeDefChildByName =
  (nodeDef: ArenaAnyNodeDef, childName: string) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef | undefined =>
    SurveyNodeDefsIndex.hasNodeDefsIndexByName(survey)
      ? Surveys.getNodeDefByName({ survey, name: childName })
      : getNodeDefChildren({ nodeDef })(survey).find((childDef) => childName === NodeDef.getName(childDef))

export const getNodeDefParent =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): ArenaNodeDefEntity | null => {
    if (NodeDef.isRoot(nodeDef)) return null
    // only entity defs can be parents
    const nodeDefParent = getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey) as ArenaNodeDefEntity | null
    return NodeDef.isVirtual(nodeDef) ? getNodeDefParent(nodeDefParent)(survey) : nodeDefParent
  }

export const getNodeDefAreaBasedEstimate =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef | undefined =>
    getNodeDefsArray(survey).find((_nodeDef) => NodeDef.getAreaBasedEstimatedOf(_nodeDef) === NodeDef.getUuid(nodeDef))

export const getAreaBasedEstimatedOfNodeDef =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef | null =>
    getNodeDefByUuid(NodeDef.getAreaBasedEstimatedOf(nodeDef))(survey)

const _nodeDefKeysFilter = (nodeDef: ArenaAnyNodeDef): boolean => NodeDef.isKey(nodeDef) && !NodeDef.isDeleted(nodeDef)

export const getNodeDefKeys =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    getNodeDefDescendantAttributesInSingleEntities({ nodeDef })(survey).filter(_nodeDefKeysFilter)

export const getNodeDefKeysSorted =
  ({ nodeDef, cycle }: { nodeDef: ArenaAnyNodeDef; cycle?: string | null }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    getNodeDefDescendantsInSingleEntities({ nodeDef, cycle, sorted: true })(survey).filter(_nodeDefKeysFilter)

export const getNodeDefRootKeys = (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
  const root = getNodeDefRoot(survey)
  return root ? getNodeDefKeys(root)(survey) : []
}

export const getNodeDefRootKeysSorted =
  ({ cycle }: { cycle?: string | null }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    const root = getNodeDefRoot(survey)
    return root ? getNodeDefKeysSorted({ nodeDef: root, cycle })(survey) : []
  }

export const getSummaryDefs =
  ({ nodeDef, cycle }: { nodeDef: ArenaAnyNodeDef; cycle: string }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    getNodeDefDescendantAttributesInSingleEntities({ nodeDef, cycle, sorted: true })(survey).filter((childDef) =>
      NodeDefLayout.isIncludedInMultipleEntitySummary(cycle)(childDef)
    )

export const getRootSummaryDefs =
  ({ cycle }: { cycle: string }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    const root = getNodeDefRoot(survey)
    return root ? getSummaryDefs({ nodeDef: root, cycle })(survey) : []
  }

export const isNodeDefRootKey =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): boolean =>
    NodeDef.isKey(nodeDef) && NodeDef.isRoot(getNodeDefParent(nodeDef)(survey))

export const canNodeDefBeQualifier =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): boolean =>
    (NodeDef.isText(nodeDef) || NodeDef.isCode(nodeDef)) &&
    !NodeDef.isMultiple(nodeDef) &&
    NodeDef.isRoot(getNodeDefParent(nodeDef)(survey))

export const getNodeDefsRootUnique = (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
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
  (survey: ArenaSurvey): ArenaAnyNodeDef =>
    Surveys.getNodeDefByName({ survey, name })

export const getNodeDefsByCategoryUuid =
  (uuid: string) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    getNodeDefsArray(survey).filter(A.pathEq([NodeDef.keys.props, NodeDef.propKeys.categoryUuid], uuid))

export const getNodeDefsByTaxonomyUuid =
  (uuid: string) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    getNodeDefsArray(survey).filter(A.pathEq([NodeDef.keys.props, NodeDef.propKeys.taxonomyUuid], uuid))

export const findNodeDef =
  (predicate: NodeDefPredicate) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef | undefined =>
    getNodeDefsArray(survey).find(predicate)

export const findNodeDefByName =
  (name: string) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef | undefined =>
    Surveys.findNodeDefByName({ survey, name })

export const getNodeDefMaxDecimalDigits =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey?: ArenaSurvey | null): number => {
    const referenceNodeDef =
      survey && NodeDef.isAreaBasedEstimatedOf(nodeDef) ? getAreaBasedEstimatedOfNodeDef(nodeDef)(survey) : nodeDef
    return NodeDef.getMaxNumberDecimalDigits(referenceNodeDef)
  }

// ====== UPDATE

export const assocNodeDefs =
  (nodeDefs: ArenaNodeDefMap): SurveyUpdater =>
  (survey) => {
    const surveyUpdated = A.assoc(nodeDefsKey, nodeDefs)(survey)
    return SurveyNodeDefsIndex.initAndAssocNodeDefsIndex(surveyUpdated)
  }

const updateNodeDefs =
  (updateFn: (nodeDefs: ArenaNodeDefMap) => ArenaNodeDefMap): SurveyUpdater =>
  (survey) => {
    const nodeDefsPrev = getNodeDefs(survey)
    const nodeDefsUpdated = updateFn(nodeDefsPrev)
    return assocNodeDefs(nodeDefsUpdated)(survey)
  }

export const assocNodeDef = (nodeDef: ArenaAnyNodeDef): SurveyUpdater =>
  updateNodeDefs(A.assoc(NodeDef.getUuid(nodeDef), nodeDef))

// merge the specified node defs with the ones already in the survey
export const mergeNodeDefs = (nodeDefs: ArenaNodeDefMap): SurveyUpdater =>
  updateNodeDefs((nodeDefsPrev) => ({ ...nodeDefsPrev, ...nodeDefs }))

export const dissocNodeDef = (nodeDefUuid: string): SurveyUpdater => updateNodeDefs(A.dissoc(nodeDefUuid))

const updateClonedEntityDefLayout = ({
  clonedEntityDef,
  newUuidByOldUuid,
}: {
  clonedEntityDef: ArenaNodeDefEntity
  newUuidByOldUuid: Record<string, string>
}): ArenaAnyNodeDef => {
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
  (survey: ArenaSurvey): { clonedNodeDefs: ArenaAnyNodeDef[]; rootClonedNodeDef: ArenaAnyNodeDef } => {
    const nodeDef = getNodeDefByUuid(nodeDefUuid)(survey)
    const nodeDefParent = getNodeDefByUuid(targetParentNodeDefUuid)(survey) as ArenaNodeDefEntity
    const existingNodeDefNames = existingNodeDefNamesParam ?? getNodeDefsArray(survey).map((nd) => NodeDef.getName(nd))

    // Gather all descendants (including nested entities)
    const nodeDefDescendants = getNodeDefDescendants({ nodeDef })(survey)

    const newUuidByOldUuid: Record<string, string> = {}
    const clonedNodeDefsByNewUuid: ArenaNodeDefMap = {}
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
        : (clonedNodeDefsByNewUuid[newUuidByOldUuid[NodeDef.getParentUuid(nd)]] as ArenaNodeDefEntity)
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
    nodeDef: ArenaAnyNodeDef
    predicate?: NodeDefPredicate
    visitorFn?: NodeDefVisitor
    includeSelf?: boolean
    stopAtFirstFound?: boolean
  }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    const result: ArenaAnyNodeDef[] = []
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
  ({ nodeDef, predicate }: { nodeDef: ArenaAnyNodeDef; predicate: NodeDefPredicate }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef | undefined =>
    findAncestors({ nodeDef, predicate, includeSelf: false, stopAtFirstFound: true })(survey)[0]

export const visitAncestors =
  (nodeDef: ArenaAnyNodeDef, visitorFn: NodeDefVisitor, includeSelf = true) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    findAncestors({ nodeDef, visitorFn, includeSelf })(survey)

export const visitAncestorsAndSelf = (nodeDef: ArenaAnyNodeDef, visitorFn: NodeDefVisitor) =>
  visitAncestors(nodeDef, visitorFn, true)

export const isNodeDefAncestor =
  (nodeDefAncestor: ArenaAnyNodeDef, nodeDefDescendant: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): boolean => {
    if (NodeDef.isRoot(nodeDefDescendant)) {
      return false
    }
    const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
    return NodeDef.getUuid(nodeDefParent) === NodeDef.getUuid(nodeDefAncestor)
      ? true
      : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

export const getNodeDefAncestorMultipleEntity =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): ArenaNodeDefEntity | null => {
    let nodeDefCurrent = getNodeDefParent(nodeDef)(survey)
    while (nodeDefCurrent && !NodeDef.isRoot(nodeDefCurrent) && !NodeDef.isMultipleEntity(nodeDefCurrent)) {
      nodeDefCurrent = getNodeDefParent(nodeDefCurrent)(survey)
    }
    return nodeDefCurrent
  }

export const getNodeDefAncestorsKeyAttributes =
  (nodeDef: ArenaAnyNodeDef, includeSelf = false) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    let ancestorsKeyAttributes: ArenaAnyNodeDef[] = []
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
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): Record<string, ArenaAnyNodeDef[]> => {
    const ancestorsKeyAttributesIndexed: Record<string, ArenaAnyNodeDef[]> = {}
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
    nodeDef: ArenaAnyNodeDef
    showLabels?: boolean
    labelLang?: string | null
    includeRootEntity?: boolean
    separator?: string
  }) =>
  (survey: ArenaSurvey): string => {
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
  (survey: ArenaSurvey): { root: NodeDefHierarchyItem; length: number } => {
    let length = 1
    const h = (array: NodeDefHierarchyItem[], nodeDef: ArenaAnyNodeDef): NodeDefHierarchyItem[] => {
      const childDefs: ArenaAnyNodeDef[] = []
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
  nodeDef?: ArenaAnyNodeDef | null
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
  (survey: ArenaSurvey): void => {
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
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    const descendants: ArenaAnyNodeDef[] = []
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
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    const descendants: ArenaAnyNodeDef[] = []
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
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    getNodeDefDescendantsAndSelf({ nodeDef, cycle, traverseMethod })(survey).filter(
      (descendant) => !NodeDef.isEqual(nodeDef)(descendant)
    )

// OLAP
const multipleEntityFilterFunction = (nodeDef: ArenaAnyNodeDef): boolean =>
  NodeDef.isRoot(nodeDef) || NodeDef.isMultipleEntity(nodeDef)

export const getOlapDataTableEntityDefs = (survey: ArenaSurvey): ArenaNodeDefEntity[] =>
  ArrayUtils.sortById(findDescendants({ filterFn: multipleEntityFilterFunction })(survey)) as ArenaNodeDefEntity[]

// ====== NODE DEFS CODE UTILS
export const getNodeDefParentCode = (nodeDef: ArenaAnyNodeDef) =>
  getNodeDefByUuid(NodeDef.getParentCodeDefUuid(nodeDef))

export const getNodeDefAncestorCodes =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] =>
    Surveys.getNodeDefAncestorCodes({ survey, nodeDef: nodeDef as ArenaNodeDefCode })

export const isNodeDefParentCode =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): boolean =>
    getNodeDefsArray(survey).some((def) => NodeDef.getParentCodeDefUuid(def) === NodeDef.getUuid(nodeDef))

export const getNodeDefCategoryLevelIndex =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): number => {
    const parentCodeNodeDef = getNodeDefParentCode(nodeDef)(survey)
    return parentCodeNodeDef ? 1 + getNodeDefCategoryLevelIndex(parentCodeNodeDef)(survey) : 0
  }

export const getNodeDefCodeCandidateParents =
  ({ nodeDef, category }: { nodeDef: ArenaAnyNodeDef; category: ArenaCategory }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    if (!category || !nodeDef) {
      return []
    }
    const levelsLength = Category.getLevelsArray(category).length
    // single attributes with the same category, other than nodeDef itself, not at the leaf level
    const isCandidate = (childDef: ArenaAnyNodeDef): boolean =>
      !NodeDef.isMultiple(childDef) &&
      NodeDef.getCategoryUuid(childDef) === NodeDef.getCategoryUuid(nodeDef) &&
      !NodeDef.isEqual(childDef)(nodeDef) &&
      getNodeDefCategoryLevelIndex(childDef)(survey) !== levelsLength - 1

    const candidates: ArenaAnyNodeDef[] = []
    visitAncestorsAndSelf(nodeDef, (nodeDefAncestor) => {
      if (!NodeDef.isEqual(nodeDefAncestor)(nodeDef)) {
        candidates.push(...getNodeDefChildren({ nodeDef: nodeDefAncestor })(survey).filter(isCandidate))
      }
    })(survey)
    return candidates
  }

export const canUpdateCategory =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): boolean =>
    (!NodeDef.isPublished(nodeDef) || SurveyInfo.isTemplate(SurveyInfo.getInfo(survey))) &&
    !isNodeDefParentCode(nodeDef)(survey)
