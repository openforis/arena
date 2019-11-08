import * as R from 'ramda'

import * as SurveyCategories from './surveyCategories'
import * as NodeDef from '../nodeDef'
import * as Category from '../category'

const nodeDefsKey = 'nodeDefs'

// ====== READ
export const getNodeDefs = R.propOr({}, nodeDefsKey)

export const getNodeDefsArray = R.pipe(getNodeDefs, R.values)

export const getNodeDefRoot = R.pipe(getNodeDefsArray, R.find(R.propEq(NodeDef.keys.parentUuid, null)))

export const getNodeDefByUuid = uuid => R.pipe(getNodeDefs, R.propOr(null, uuid))

export const getNodeDefsByUuids = (uuids = []) => R.pipe(
  getNodeDefsArray,
  R.filter(nodeDef => R.includes(NodeDef.getUuid(nodeDef), uuids))
)

export const getNodeDefChildren = (nodeDef, includeAnalysis = false) => R.pipe(
  getNodeDefsArray,
  R.filter(nodeDefCurrent =>
    R.propEq(NodeDef.keys.parentUuid, NodeDef.getUuid(nodeDef), nodeDefCurrent) &&
    (includeAnalysis || !NodeDef.isAnalysis(nodeDefCurrent))
  ),
)

export const hasNodeDefChildrenEntities = nodeDef => survey => {
  if (NodeDef.isAttribute(nodeDef))
    return false

  return R.pipe(
    getNodeDefChildren(nodeDef),
    R.any(NodeDef.isEntity),
  )(survey)

}

export const getNodeDefChildByName = (nodeDef, childName) =>
  R.pipe(
    getNodeDefChildren(nodeDef),
    R.find(childDef => childName === NodeDef.getName(childDef))
  )

export const getNodeDefSiblingByName = (nodeDef, name) => survey => {
  const parentDef = getNodeDefParent(nodeDef)(survey)
  return getNodeDefChildByName(parentDef, name)(survey)
}

export const getNodeDefKeys = nodeDef => R.pipe(
  getNodeDefChildren(nodeDef),
  R.filter(n => NodeDef.isKey(n))
)

export const isNodeDefRootKey = nodeDef => survey =>
  NodeDef.isKey(nodeDef) &&
  NodeDef.isRoot(getNodeDefParent(nodeDef)(survey))

export const getNodeDefByName = (name) => R.pipe(
  getNodeDefsArray,
  R.find(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.name], name))
)

export const getNodeDefsByCategoryUuid = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.categoryUuid], uuid))
)

export const getNodeDefsByTaxonomyUuid = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.taxonomyUuid], uuid))
)

export const findNodeDef = predicate => R.pipe(
  getNodeDefsArray,
  R.find(predicate)
)

// ====== UPDATE

export const assocNodeDefs = nodeDefs => R.assoc(nodeDefsKey, nodeDefs)

// ====== HIERARCHY

export const getNodeDefParent = nodeDef => getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))

export const visitAncestorsAndSelf = (nodeDef, visitorFn) => survey => {
  let nodeDefCurrent = nodeDef
  do {
    visitorFn(nodeDefCurrent)
    nodeDefCurrent = getNodeDefParent(nodeDefCurrent)(survey)
  } while (!!nodeDefCurrent)
}

export const isNodeDefAncestor = (nodeDefAncestor, nodeDefDescendant) =>
  survey => {
    if (NodeDef.isRoot(nodeDefDescendant))
      return false

    const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
    return NodeDef.getUuid(nodeDefParent) === NodeDef.getUuid(nodeDefAncestor)
      ? true
      : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

export const getHierarchy = (filterFn = NodeDef.isEntity, includeAnalysis = false) =>
  survey => {

    let length = 1
    const h = (array, nodeDef) => {
      const childDefs = NodeDef.isEntity(nodeDef)
        ? R.pipe(getNodeDefChildren(nodeDef, includeAnalysis), R.filter(filterFn))(survey)
        : []

      length += childDefs.length
      const item = { ...nodeDef, children: R.reduce(h, [], childDefs) }
      return R.append(item, array)
    }

    return {
      root: h([], getNodeDefRoot(survey))[0],
      length
    }

  }

export const traverseHierarchyItem = async (nodeDefItem, visitorFn, depth = 0) => {
  await visitorFn(nodeDefItem, depth)
  const children = R.propOr([], 'children', nodeDefItem)
  for (const child of children) {
    await traverseHierarchyItem(child, visitorFn, depth + 1)
  }
}

export const traverseHierarchyItemSync = (nodeDefItem, visitorFn, depth = 0) => {
  visitorFn(nodeDefItem, depth)
  const children = R.propOr([], 'children', nodeDefItem)
  for (const child of children) {
    traverseHierarchyItemSync(child, visitorFn, depth + 1)
  }
}

// ====== NODE DEFS CODE UTILS
export const getNodeDefParentCode = nodeDef => getNodeDefByUuid(NodeDef.getParentCodeDefUuid(nodeDef))

export const isNodeDefParentCode = nodeDef => R.pipe(
  getNodeDefsArray,
  R.any(def => NodeDef.getParentCodeDefUuid(def) === NodeDef.getUuid(nodeDef)),
)

export const getNodeDefCodeCandidateParents = nodeDef => survey => {
  const category = SurveyCategories.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)

  if (category) {
    const levelsLength = Category.getLevelsArray(category).length

    const candidates = []
    visitAncestorsAndSelf(
      nodeDef,
      nodeDefAncestor => {
        if (!NodeDef.isEqual(nodeDefAncestor)(nodeDef)) {

          const candidatesAncestor = R.pipe(
            getNodeDefChildren(nodeDefAncestor),
            R.reject(n =>
              // reject multiple attributes
              NodeDef.isMultiple(n) ||
              // or different category nodeDef
              NodeDef.getCategoryUuid(n) !== Category.getUuid(category) ||
              // or itself
              NodeDef.getUuid(n) === NodeDef.getUuid(nodeDef) ||
              // or leaves nodeDef
              getNodeDefCategoryLevelIndex(n)(survey) === levelsLength - 1
            )
          )(survey)

          candidates.push(...candidatesAncestor)
        }
      }
    )(survey)
    return candidates
  } else {
    return []
  }
}

export const getNodeDefCategoryLevelIndex = nodeDef =>
  survey => {
    const parentCodeNodeDef = getNodeDefParentCode(nodeDef)(survey)
    return parentCodeNodeDef
      ? 1 + getNodeDefCategoryLevelIndex(parentCodeNodeDef)(survey)
      : 0
  }

export const canUpdateCategory = nodeDef =>
  survey =>
    !(NodeDef.isPublished(nodeDef) || isNodeDefParentCode(nodeDef)(survey))

// ====== NodeDef Taxonomy
export const canUpdateTaxonomy = nodeDef => () => !NodeDef.isPublished(nodeDef)
