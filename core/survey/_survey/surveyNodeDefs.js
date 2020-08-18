import * as R from 'ramda'

import * as PromiseUtils from '../../promiseUtils'
import * as NodeDef from '../nodeDef'
import * as Category from '../category'
import * as SurveyCategories from './surveyCategories'

const nodeDefsKey = 'nodeDefs'

// ====== READ
export const getNodeDefs = R.propOr({}, nodeDefsKey)

export const getNodeDefsArray = R.pipe(getNodeDefs, R.values)

export const getNodeDefRoot = R.pipe(getNodeDefsArray, R.find(NodeDef.isRoot))

export const getNodeDefByUuid = (uuid) => R.pipe(getNodeDefs, R.propOr(null, uuid))

export const getNodeDefsByUuids = (uuids = []) => (survey) => {
  if (R.isEmpty(uuids)) {
    return []
  }
  return uuids.map((uuid) => getNodeDefByUuid(uuid)(survey))
}

export const getNodeDefSource = (nodeDef) =>
  NodeDef.isVirtual(nodeDef) ? getNodeDefByUuid(NodeDef.getParentUuid(nodeDef)) : null

export const getNodeDefChildren = (nodeDef, includeAnalysis = false) => (survey) => {
  const children = []
  if (NodeDef.isVirtual(nodeDef)) {
    // If nodeDef is virtual, get children from its source
    const entitySource = getNodeDefSource(nodeDef)(survey)
    children.push(...getNodeDefChildren(entitySource, includeAnalysis)(survey))
  }

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  children.push(
    ...R.pipe(
      getNodeDefsArray,
      R.filter((nodeDefCurrent) => {
        if (NodeDef.isAnalysis(nodeDefCurrent) && !includeAnalysis) {
          return false
        }
        if (NodeDef.isVirtual(nodeDefCurrent)) {
          // Include virtual entities having their source as a child of the given entity
          const entitySource = getNodeDefSource(nodeDefCurrent)(survey)
          return NodeDef.getParentUuid(entitySource) === nodeDefUuid
        }
        // "natural" child
        return NodeDef.getParentUuid(nodeDefCurrent) === nodeDefUuid
      })
    )(survey)
  )
  return children
}

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
  const nodeDefParent = getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey)
  return NodeDef.isVirtual(nodeDef) ? getNodeDefParent(nodeDefParent)(survey) : nodeDefParent
}

export const getNodeDefSiblingByName = (nodeDef, name) => (survey) => {
  const parentDef = getNodeDefParent(nodeDef)(survey)
  return getNodeDefChildByName(parentDef, name)(survey)
}

export const getNodeDefKeys = (nodeDef) =>
  R.pipe(
    getNodeDefChildren(nodeDef),
    R.filter((n) => NodeDef.isKey(n) && !NodeDef.isDeleted(n))
  )

export const getNodeDefRootKeys = (survey) => getNodeDefKeys(getNodeDefRoot(survey))(survey)

export const isNodeDefRootKey = (nodeDef) => (survey) =>
  NodeDef.isKey(nodeDef) && NodeDef.isRoot(getNodeDefParent(nodeDef)(survey))

export const getNodeDefByName = (name) =>
  R.pipe(getNodeDefsArray, R.find(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.name], name)))

export const getNodeDefsByCategoryUuid = (uuid) =>
  R.pipe(getNodeDefsArray, R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.categoryUuid], uuid)))

export const getNodeDefsByTaxonomyUuid = (uuid) =>
  R.pipe(getNodeDefsArray, R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.taxonomyUuid], uuid)))

export const findNodeDef = (predicate) => R.pipe(getNodeDefsArray, R.find(predicate))

// ====== UPDATE

export const assocNodeDefs = (nodeDefs) => R.assoc(nodeDefsKey, nodeDefs)
export const assocNodeDef = (nodeDef) => R.assocPath([nodeDefsKey, NodeDef.getUuid(nodeDef)], nodeDef)

// ====== HIERARCHY

export const visitAncestorsAndSelf = (nodeDef, visitorFn) => (survey) => {
  let nodeDefCurrent = nodeDef
  do {
    visitorFn(nodeDefCurrent)
    nodeDefCurrent = getNodeDefParent(nodeDefCurrent)(survey)
  } while (nodeDefCurrent)
}

export const isNodeDefAncestor = (nodeDefAncestor, nodeDefDescendant) => (survey) => {
  if (NodeDef.isRoot(nodeDefDescendant)) {
    return false
  }

  const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
  return NodeDef.getUuid(nodeDefParent) === NodeDef.getUuid(nodeDefAncestor)
    ? true
    : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
}

export const getHierarchy = (filterFn = NodeDef.isEntity, includeAnalysis = false) => (survey) => {
  let length = 1
  const h = (array, nodeDef) => {
    const childDefs = [
      ...(NodeDef.isEntity(nodeDef) && !NodeDef.isVirtual(nodeDef)
        ? R.pipe(getNodeDefChildren(nodeDef, includeAnalysis), R.filter(filterFn))(survey)
        : []),
    ]

    length += childDefs.length
    const item = { ...nodeDef, children: R.reduce(h, [], childDefs) }
    return R.append(item, array)
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

export const getNodeDefCodeCandidateParents = (nodeDef) => (survey) => {
  const category = SurveyCategories.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)

  if (category) {
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
              NodeDef.getCategoryUuid(n) !== Category.getUuid(category) ||
              // Or itself
              NodeDef.getUuid(n) === NodeDef.getUuid(nodeDef) ||
              // Or leaves nodeDef
              getNodeDefCategoryLevelIndex(n)(survey) === levelsLength - 1
          )
        )(survey)

        candidates.push(...candidatesAncestor)
      }
    })(survey)
    return candidates
  }

  return []
}

export const canUpdateCategory = (nodeDef) => (survey) =>
  !(NodeDef.isPublished(nodeDef) || isNodeDefParentCode(nodeDef)(survey))
