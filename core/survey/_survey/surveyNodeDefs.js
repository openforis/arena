import * as R from 'ramda'

import { Surveys } from '@openforis/arena-core'

import * as PromiseUtils from '../../promiseUtils'
import * as NodeDef from '../nodeDef'
import * as NodeDefLayout from '../nodeDefLayout'
import * as NodeDefValidations from '../nodeDefValidations'
import * as Category from '../category'
import * as SurveyInfo from './surveyInfo'
import * as SurveyNodeDefsIndex from './surveyNodeDefsIndex'
import Queue from '@core/queue'

const nodeDefsKey = 'nodeDefs'

// ====== READ
export const getNodeDefs = R.propOr({}, nodeDefsKey)

export const getNodeDefsArray = R.pipe(getNodeDefs, R.values)

export const getNodeDefRoot = (survey) => Surveys.getNodeDefRoot({ survey })

export const getNodeDefByUuid = (uuid) => R.pipe(getNodeDefs, R.propOr(null, uuid))

export const getNodeDefsByUuids =
  (uuids = []) =>
  (survey) =>
    // do not throw error if node defs are missing
    Surveys.findNodeDefsByUuids({ survey, uuids })

export const getNodeDefSource = (nodeDef) =>
  NodeDef.isVirtual(nodeDef) ? getNodeDefByUuid(NodeDef.getParentUuid(nodeDef)) : null

const filterNodeDefsWithoutSiblings = (nodeDefs) =>
  nodeDefs.filter(
    (nodeDef) =>
      !NodeDef.isSampling(nodeDef) ||
      nodeDefs.filter(
        (_nodeDef) => NodeDef.isAnalysis(_nodeDef) && NodeDef.getChainUuid(_nodeDef) === NodeDef.getChainUuid(nodeDef)
      ).length > 1
  )

export const getNodeDefChildren =
  (nodeDef, includeAnalysis = true) =>
  (survey) => {
    const surveyIndexed = survey.nodeDefsIndex ? survey : SurveyNodeDefsIndex.initAndAssocNodeDefsIndex(survey)
    let childDefs = Surveys.getNodeDefChildren({ survey: surveyIndexed, nodeDef, includeAnalysis })
    childDefs = filterNodeDefsWithoutSiblings(childDefs)
    return childDefs
  }

export const getNodeDefChildrenSorted =
  ({ nodeDef, includeAnalysis = false, cycle = null }) =>
  (survey) => {
    let childDefs = Surveys.getNodeDefChildrenSorted({ survey, nodeDef, includeAnalysis, cycle })
    childDefs = filterNodeDefsWithoutSiblings(childDefs)
    return childDefs
  }

export const getNodeDefChildrenInOwnPage =
  ({ nodeDef, cycle }) =>
  (survey) => {
    const children = getNodeDefChildren(nodeDef)(survey)
    const childrenInOwnPage = children.filter(NodeDefLayout.hasPage(cycle))
    const childrenIndex = NodeDefLayout.getIndexChildren(cycle)(nodeDef)
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

export const getNodeDefDescendantsInSingleEntities =
  ({ nodeDef, includeAnalysis, filterFn, sorted = false, cycle = null }) =>
  (survey) => {
    const descendants = []

    const queue = new Queue()
    queue.enqueue(nodeDef)

    while (!queue.isEmpty()) {
      const entityDefCurrent = queue.dequeue()
      const entityDefCurrentChildren = sorted
        ? getNodeDefChildrenSorted({ nodeDef: entityDefCurrent, includeAnalysis, cycle })(survey)
        : getNodeDefChildren(entityDefCurrent, includeAnalysis)(survey)

      descendants.push(...entityDefCurrentChildren.filter(filterFn))

      // visit nodes inside single entities
      queue.enqueueItems(entityDefCurrentChildren.filter(NodeDef.isSingleEntity))
    }
    return descendants
  }

export const getNodeDefDescendantAttributesInSingleEntities = ({
  nodeDef,
  includeAnalysis = false,
  sorted = false,
  cycle = null,
}) =>
  getNodeDefDescendantsInSingleEntities({
    nodeDef,
    includeAnalysis,
    filterFn: NodeDef.isSingleAttribute,
    sorted,
    cycle,
  })

export const hasNodeDefChildrenEntities = (nodeDef) => (survey) => {
  if (NodeDef.isAttribute(nodeDef)) {
    return false
  }

  return R.pipe(getNodeDefChildren(nodeDef), R.any(NodeDef.isEntity))(survey)
}

export const getNodeDefChildByName = (nodeDef, childName) =>
  R.pipe(
    getNodeDefChildren(nodeDef),
    R.find((childDef) => childName === NodeDef.getName(childDef))
  )

export const getNodeDefParent = (nodeDef) => (survey) => {
  if (NodeDef.isRoot(nodeDef)) return null
  const nodeDefParent = getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey)
  return NodeDef.isVirtual(nodeDef) ? getNodeDefParent(nodeDefParent)(survey) : nodeDefParent
}

export const getNodeDefAreaBasedEstimate = (nodeDef) => (survey) =>
  getNodeDefsArray(survey).find((_nodeDef) => NodeDef.getAreaBasedEstimatedOf(_nodeDef) === NodeDef.getUuid(nodeDef))

export const getAreaBasedEstimatedOfNodeDef = (nodeDef) => (survey) =>
  getNodeDefByUuid(NodeDef.getAreaBasedEstimatedOf(nodeDef))(survey)

export const getNodeDefSiblingByName = (nodeDef, name) => (survey) => {
  const parentDef = getNodeDefParent(nodeDef)(survey)
  return getNodeDefChildByName(parentDef, name)(survey)
}

const _nodeDefKeysFilter = (n) => NodeDef.isKey(n) && !NodeDef.isDeleted(n)

export const getNodeDefKeys = (nodeDef) => (survey) => getNodeDefChildren(nodeDef)(survey).filter(_nodeDefKeysFilter)

export const getNodeDefKeysSorted =
  ({ nodeDef, cycle }) =>
  (survey) =>
    getNodeDefChildrenSorted({ nodeDef, cycle })(survey).filter(_nodeDefKeysFilter)

export const getNodeDefRootKeys = (survey) => {
  const root = getNodeDefRoot(survey)
  return root ? getNodeDefKeys(root)(survey) : []
}

export const isNodeDefRootKey = (nodeDef) => (survey) =>
  NodeDef.isKey(nodeDef) && NodeDef.isRoot(getNodeDefParent(nodeDef)(survey))

export const getNodeDefsRootUnique = (survey) => {
  const nodeDefRoot = getNodeDefRoot(survey)
  return getNodeDefChildren(nodeDefRoot)(survey).filter(
    (nodeDef) => NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef)) && !NodeDef.isDeleted(nodeDef)
  )
}

export const getNodeDefByName = (name) =>
  R.pipe(getNodeDefsArray, R.find(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.name], name)))

export const getNodeDefsByCategoryUuid = (uuid) =>
  R.pipe(getNodeDefsArray, R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.categoryUuid], uuid)))

export const getNodeDefsByTaxonomyUuid = (uuid) =>
  R.pipe(getNodeDefsArray, R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.taxonomyUuid], uuid)))

export const findNodeDef = (predicate) => R.pipe(getNodeDefsArray, R.find(predicate))

// ====== UPDATE

export const assocNodeDefs = (nodeDefs) => (survey) => {
  const surveyUpdated = R.assoc(nodeDefsKey, nodeDefs)(survey)
  return SurveyNodeDefsIndex.initAndAssocNodeDefsIndex(surveyUpdated)
}

const updateNodeDefs = (updateFn) => (survey) => {
  const nodeDefsPrev = getNodeDefs(survey)
  const nodeDefsUpdated = updateFn(nodeDefsPrev)
  return assocNodeDefs(nodeDefsUpdated)(survey)
}

export const assocNodeDef = (nodeDef) => updateNodeDefs(R.assoc(NodeDef.getUuid(nodeDef), nodeDef))

// merge the specified node defs with the ones already in the survey
export const mergeNodeDefs = (nodeDefs) => updateNodeDefs((nodeDefsPrev) => ({ ...nodeDefsPrev, ...nodeDefs }))

export const dissocNodeDef = (nodeDefUuid) => updateNodeDefs(R.dissoc(nodeDefUuid))

// ====== HIERARCHY

export const visitAncestors =
  (nodeDef, visitorFn, includeSelf = true) =>
  (survey) => {
    let nodeDefToVisit = includeSelf ? nodeDef : getNodeDefParent(nodeDef)(survey)
    while (nodeDefToVisit) {
      visitorFn(nodeDefToVisit)
      nodeDefToVisit = getNodeDefParent(nodeDefToVisit)(survey)
    }
  }

export const visitAncestorsAndSelf = (nodeDef, visitorFn) => visitAncestors(nodeDef, visitorFn, true)

export const isNodeDefAncestor = (nodeDefAncestor, nodeDefDescendant) => (survey) => {
  if (NodeDef.isRoot(nodeDefDescendant)) {
    return false
  }

  const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
  return NodeDef.getUuid(nodeDefParent) === NodeDef.getUuid(nodeDefAncestor)
    ? true
    : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
}

export const getNodeDefAncestorMultipleEntity = (nodeDef) => (survey) => {
  let nodeDefCurrent = nodeDef
  do {
    nodeDefCurrent = getNodeDefParent(nodeDefCurrent)(survey)
  } while (nodeDefCurrent && !NodeDef.isRoot(nodeDefCurrent) && !NodeDef.isMultipleEntity(nodeDefCurrent))
  return nodeDefCurrent
}

export const getNodeDefAncestorsKeyAttributes =
  (nodeDef, includeSelf = false) =>
  (survey) => {
    let ancestorsKeyAttributes = []
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

export const getNodeDefAncestorsKeyAttributesByAncestorUuid = (nodeDef) => (survey) => {
  let ancestorsKeyAttributesIndexed = {}
  visitAncestors(nodeDef, (ancestorDef) => {
    const ancestorKeyAttributes = getNodeDefKeys(ancestorDef)(survey)
    ancestorsKeyAttributesIndexed[NodeDef.getUuid(ancestorDef)] = ancestorKeyAttributes
  })(survey)
  return ancestorsKeyAttributesIndexed
}

export const getNodeDefPath =
  ({ nodeDef, showLabels = false, labelLang = null, includeRootEntity = true, separator = ' / ' }) =>
  (survey) => {
    const pathParts = []

    visitAncestorsAndSelf(nodeDef, (currentNodeDef) => {
      if (!includeRootEntity && NodeDef.isRoot(currentNodeDef)) return
      const pathPart = showLabels ? NodeDef.getLabel(currentNodeDef, labelLang) : NodeDef.getName(currentNodeDef)
      pathParts.unshift(pathPart)
    })(survey)

    return pathParts.join(separator)
  }

export const getHierarchy =
  (filterFn = NodeDef.isEntity) =>
  (survey) => {
    let length = 1
    const h = (array, nodeDef) => {
      const childDefs = [
        ...(NodeDef.isEntity(nodeDef) && !NodeDef.isVirtual(nodeDef)
          ? R.pipe(getNodeDefChildren(nodeDef), R.filter(filterFn))(survey)
          : []),
      ]

      length += childDefs.length
      const item = { ...nodeDef, children: childDefs.reduce(h, []) }
      array.push(item)
      return array
    }

    return {
      root: h([], getNodeDefRoot(survey))[0],
      length,
    }
  }

export const traverseHierarchyItem = async (nodeDefItem, visitorFn, depth = 0) => {
  await visitorFn(nodeDefItem, depth)
  const children = R.propOr([], 'children', nodeDefItem)
  await PromiseUtils.each(children, async (child) => {
    await traverseHierarchyItem(child, visitorFn, depth + 1)
  })
}

export const traverseHierarchyItemSync = (nodeDefItem, visitorFn, depth = 0) => {
  visitorFn(nodeDefItem, depth)
  const children = R.propOr([], 'children', nodeDefItem)
  children.forEach((child) => {
    traverseHierarchyItemSync(child, visitorFn, depth + 1)
  })
}

export const visitDescendantsAndSelf =
  ({ nodeDef = null, visitorFn }) =>
  (survey) => {
    const queue = new Queue()

    queue.enqueue(nodeDef || getNodeDefRoot(survey))

    while (!queue.isEmpty()) {
      const nodeDefCurrent = queue.dequeue()

      visitorFn(nodeDefCurrent)

      if (NodeDef.isEntity(nodeDefCurrent)) {
        const childrenDefs = getNodeDefChildren(nodeDefCurrent)(survey)
        queue.enqueueItems(childrenDefs)
      }
    }
  }

export const findDescendants =
  ({ nodeDef = null, filterFn }) =>
  (survey) => {
    const descendants = []
    visitDescendantsAndSelf({
      nodeDef,
      visitorFn: (nodeDefCurrent) => {
        if (filterFn(nodeDefCurrent)) {
          descendants.push(nodeDefCurrent)
        }
      },
    })(survey)
    return descendants
  }

export const getDescendantsAndSelf =
  ({ nodeDef = null }) =>
  (survey) => {
    const descendants = []
    const queue = new Queue()

    queue.enqueue(nodeDef || getNodeDefRoot(survey))

    while (!queue.isEmpty()) {
      const nodeDefCurrent = queue.dequeue()

      descendants.push(nodeDefCurrent)

      const childrenDefs = getNodeDefChildren(nodeDefCurrent)(survey)
      queue.enqueueItems(childrenDefs)
    }
    return descendants
  }

// ====== NODE DEFS CODE UTILS
export const getNodeDefParentCode = (nodeDef) => getNodeDefByUuid(NodeDef.getParentCodeDefUuid(nodeDef))

export const isNodeDefParentCode = (nodeDef) =>
  R.pipe(
    getNodeDefsArray,
    R.any((def) => NodeDef.getParentCodeDefUuid(def) === NodeDef.getUuid(nodeDef))
  )

export const getNodeDefCategoryLevelIndex = (nodeDef) => (survey) => {
  const parentCodeNodeDef = getNodeDefParentCode(nodeDef)(survey)
  return parentCodeNodeDef ? 1 + getNodeDefCategoryLevelIndex(parentCodeNodeDef)(survey) : 0
}

export const getNodeDefCodeCandidateParents =
  ({ nodeDef, category }) =>
  (survey) => {
    if (!category || !nodeDef) {
      return []
    }
    const levelsLength = Category.getLevelsArray(category).length
    const candidates = []
    visitAncestorsAndSelf(nodeDef, (nodeDefAncestor) => {
      if (!NodeDef.isEqual(nodeDefAncestor)(nodeDef)) {
        const candidatesAncestor = R.pipe(
          getNodeDefChildren(nodeDefAncestor),
          R.reject(
            (n) =>
              // Reject multiple attributes
              NodeDef.isMultiple(n) ||
              // Or different category nodeDef
              NodeDef.getCategoryUuid(n) !== NodeDef.getCategoryUuid(nodeDef) ||
              // Or itself
              NodeDef.isEqual(n)(nodeDef) ||
              // Or leaves nodeDef
              getNodeDefCategoryLevelIndex(n)(survey) === levelsLength - 1
          )
        )(survey)

        candidates.push(...candidatesAncestor)
      }
    })(survey)
    return candidates
  }

export const canUpdateCategory = (nodeDef) => (survey) =>
  (!NodeDef.isPublished(nodeDef) || SurveyInfo.isTemplate(SurveyInfo.getInfo(survey))) &&
  !isNodeDefParentCode(nodeDef)(survey)
