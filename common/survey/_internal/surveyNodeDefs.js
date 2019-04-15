const R = require('ramda')

const SurveyCategories = require('./surveyCategories')
const NodeDef = require('./../nodeDef')
const Category = require('../category')

const nodeDefsKey = 'nodeDefs'

// ====== READ
const getNodeDefs = R.propOr({}, nodeDefsKey)

const getNodeDefsArray = R.pipe(getNodeDefs, R.values)

const getNodeDefsByParentUuid = parentUuid => R.pipe(
  getNodeDefsArray,
  R.filter(R.propEq(NodeDef.propKeys.parentUuid, parentUuid)),
)

const getRootNodeDef = R.pipe(getNodeDefsByParentUuid(null), R.head)

const getNodeDefByUuid = uuid => R.pipe(getNodeDefs, R.propOr(null, uuid))

const getNodeDefsByUuids = (uuids = []) => R.pipe(
  getNodeDefsArray,
  R.filter(nodeDef => R.includes(NodeDef.getUuid(nodeDef), uuids))
)

const getNodeDefChildren = nodeDef => getNodeDefsByParentUuid(NodeDef.getUuid(nodeDef))

const getNodeDefChildByName = (nodeDef, childName) =>
  R.pipe(
    getNodeDefChildren(nodeDef),
    R.find(childDef => childName === NodeDef.getName(childDef))
  )

const getNodeDefSiblingByName = (nodeDef, name) => survey => {
  const parentDef = getNodeDefParent(nodeDef)(survey)
  return getNodeDefChildByName(parentDef, name)(survey)
}

const getNodeDefKeys = nodeDef => R.pipe(
  getNodeDefChildren(nodeDef),
  R.filter(n => NodeDef.isKey(n))
)

const getNodeDefByName = (name) => R.pipe(
  getNodeDefsArray,
  R.find(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.name], name))
)

/**
 * Returns a node def in the specified path (root not included).
 * E.g. path = ['plot', 'tree', 'dbh']
 */
const getNodeDefByPath = path =>
  survey => R.pipe(
    getRootNodeDef,
    rootDef => R.reduce((currentParent, childName) => getNodeDefChildByName(currentParent, childName)(survey), rootDef, path)
  )(survey)

const getNodeDefsByCategoryUuid = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.categoryUuid], uuid))
)

const getNodeDefsByTaxonomyUuid = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.taxonomyUuid], uuid))
)

const findNodeDef = predicate => R.pipe(
  getNodeDefsArray,
  R.find(predicate)
)

// ====== UPDATE

const assocNodeDefs = nodeDefs => R.assoc(nodeDefsKey, nodeDefs)

// ====== HIERARCHY

const getNodeDefParent = nodeDef => getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))

const getAncestorsHierarchy = nodeDef =>
  survey => {
    if (NodeDef.isRoot(nodeDef)) {
      return []
    } else {
      const parent = getNodeDefParent(nodeDef)(survey)
      return R.append(parent, getAncestorsHierarchy(parent)(survey))
    }
  }

const isNodeDefAncestor = (nodeDefAncestor, nodeDefDescendant) =>
  survey => {
    if (NodeDef.isRoot(nodeDefDescendant))
      return false

    const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
    return NodeDef.getUuid(nodeDefParent) === NodeDef.getUuid(nodeDefAncestor)
      ? true
      : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

const getHierarchy = (filterFn = NodeDef.isEntity) =>
  survey => {

    let length = 1
    const h = (array, nodeDef) => {
      const childDefs = NodeDef.isEntity(nodeDef)
        ? R.pipe(getNodeDefChildren(nodeDef), R.filter(filterFn))(survey)
        : []

      length += childDefs.length
      const item = { ...nodeDef, children: R.reduce(h, [], childDefs) }
      return R.append(item, array)
    }

    return {
      root: h([], getRootNodeDef(survey))[0],
      length
    }

  }

const traverseHierarchyItem = async (nodeDefItem, visitorFn, depth = 0) => {
  await visitorFn(nodeDefItem, depth)
  const children = R.propOr([], 'children', nodeDefItem)
  for (const child of children) {
    await traverseHierarchyItem(child, visitorFn, depth + 1)
  }
}

const traverseHierarchyItemSync = (nodeDefItem, visitorFn, depth = 0) => {
  visitorFn(nodeDefItem, depth)
  const children = R.propOr([], 'children', nodeDefItem)
  for (const child of children) {
    traverseHierarchyItemSync(child, visitorFn, depth + 1)
  }
}

// ====== NODE DEFS CODE UTILS
const getNodeDefParentCode = nodeDef => getNodeDefByUuid(NodeDef.getParentCodeDefUuid(nodeDef))

const isNodeDefParentCode = nodeDef => R.pipe(
  getNodeDefsArray,
  R.any(def => NodeDef.getParentCodeDefUuid(def) === NodeDef.getUuid(nodeDef)),
)

const getNodeDefCodeCandidateParents = nodeDef =>
  survey => {
    const category = SurveyCategories.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)

    if (category) {
      const levelsLength = Category.getLevelsArray(category).length
      const ancestors = getAncestorsHierarchy(nodeDef)(survey)

      return R.reduce(
        (acc, ancestor) =>
          R.pipe(
            getNodeDefChildren(ancestor),
            R.reject(n =>
              // reject multiple attributes
              NodeDef.isMultiple(n)
              ||
              // or different category nodeDef
              NodeDef.getCategoryUuid(n) !== Category.getUuid(category)
              ||
              // or itself
              NodeDef.getUuid(n) === NodeDef.getUuid(nodeDef)
              ||
              // or leaves nodeDef
              getNodeDefCategoryLevelIndex(n)(survey) === levelsLength - 1
            ),
            R.concat(acc),
          )(survey),
        [],
        ancestors
      )

    } else {
      return []
    }
  }

const getNodeDefCategoryLevelIndex = nodeDef =>
  survey => {
    const parentCodeNodeDef = getNodeDefParentCode(nodeDef)(survey)
    return parentCodeNodeDef
      ? 1 + getNodeDefCategoryLevelIndex(parentCodeNodeDef)(survey)
      : 0
  }

const canUpdateCategory = nodeDef =>
  survey =>
    !(NodeDef.isPublished(nodeDef) || isNodeDefParentCode(nodeDef)(survey))

module.exports = {
  getNodeDefs,
  getNodeDefsArray,

  // getNodeDefById,
  getRootNodeDef,
  getNodeDefByUuid,
  getNodeDefsByUuids,
  getNodeDefChildren,
  getNodeDefChildByName,
  getNodeDefSiblingByName,
  getNodeDefKeys,
  getNodeDefByName,
  getNodeDefByPath,

  getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid,

  findNodeDef,

  // ====== UPDATE
  assocNodeDefs,

  // ====== HIERARCHY
  getNodeDefParent,
  getAncestorsHierarchy,
  getHierarchy,
  isNodeDefAncestor,
  traverseHierarchyItem,
  traverseHierarchyItemSync,

  // ====== NodeDef Code
  getNodeDefCategoryLevelIndex,
  getNodeDefParentCode,
  getNodeDefCodeCandidateParents,
  isNodeDefParentCode,
  canUpdateCategory,
}