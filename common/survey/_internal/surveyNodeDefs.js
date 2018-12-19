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
  R.filter(R.propEq('parentUuid', parentUuid)),
)

const getRootNodeDef = R.pipe(getNodeDefsByParentUuid(null), R.head)

const getNodeDefByUuid = uuid => R.pipe(getNodeDefs, R.propOr(null, uuid))

// const getNodeDefById = id => R.pipe(
//   getNodeDefsArray,
//   R.find(R.propEq('id', id)),
// )

const getNodeDefChildren = nodeDef => getNodeDefsByParentUuid(nodeDef.uuid)

const getNodeDefChildByName = (nodeDef, childName) =>
  R.pipe(
    getNodeDefChildren(nodeDef),
    R.find(childDef => childName === NodeDef.getNodeDefName(childDef))
  )

const getNodeDefSiblingByName = (nodeDef, name) => survey => {
  const parentDef = getNodeDefParent(nodeDef)(survey)
  return getNodeDefChildByName(parentDef, name)(survey)
}

const getNodeDefKeys = nodeDef => R.pipe(
  getNodeDefChildren(nodeDef),
  R.filter(n => NodeDef.isNodeDefKey(n))
)

const getNodeDefByName = (name) => R.pipe(
  getNodeDefsArray,
  R.find(R.pathEq(['props', 'name'], name))
)

const getNodeDefsByCategoryUuid = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq(['props', 'categoryUuid'], uuid))
)

const getNodeDefsByTaxonomyUuid = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq(['props', 'taxonomyUuid'], uuid))
)

// ====== UPDATE

const assocNodeDefs = nodeDefs => R.assoc(nodeDefsKey, nodeDefs)

// ====== HIERARCHY

const getNodeDefParent = nodeDef => getNodeDefByUuid(NodeDef.getNodeDefParentUuid(nodeDef))

const getAncestorsHierarchy = nodeDef =>
  survey => {
    if (NodeDef.isNodeDefRoot(nodeDef)) {
      return []
    } else {
      const parent = getNodeDefParent(nodeDef)(survey)
      return R.append(parent, getAncestorsHierarchy(parent)(survey))
    }
  }

const isNodeDefAncestor = (nodeDefAncestor, nodeDefDescendant) =>
  survey => {
    if (NodeDef.isNodeDefRoot(nodeDefDescendant))
      return false

    const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
    return nodeDefParent.uuid === nodeDefAncestor.uuid
      ? true
      : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

const getHierarchy = (filterFn = NodeDef.isNodeDefEntity) =>
  survey => {

    let length = 1
    const h = (array, nodeDef) => {
      const childDefs = NodeDef.isNodeDefEntity(nodeDef)
        ? R.pipe(getNodeDefChildren(nodeDef), R.filter(filterFn))(survey)
        : []

      length += childDefs.length
      const item = {...nodeDef, children: R.reduce(h, [], childDefs)}
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
const getNodeDefParentCode = nodeDef => getNodeDefByUuid(NodeDef.getNodeDefParentCodeDefUuid(nodeDef))

const isNodeDefParentCode = nodeDef => R.pipe(
  getNodeDefsArray,
  R.any(def => NodeDef.getNodeDefParentCodeDefUuid(def) === nodeDef.uuid),
)

const getNodeDefCodeCandidateParents = nodeDef =>
  survey => {
    const category = SurveyCategories.getCategoryByUuid(NodeDef.getNodeDefCategoryUuid(nodeDef))(survey)

    if (category) {
      const levelsLength = Category.getLevelsArray(category).length
      const ancestors = getAncestorsHierarchy(nodeDef)(survey)

      return R.reduce(
        (acc, ancestor) =>
          R.pipe(
            getNodeDefChildren(ancestor),
            R.reject(n =>
              // reject multiple attributes
              NodeDef.isNodeDefMultiple(n)
              ||
              // or different category nodeDef
              NodeDef.getNodeDefCategoryUuid(n) !== category.uuid
              ||
              // or itself
              n.uuid === nodeDef.uuid
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
  survey => {
    return !isNodeDefParentCode(nodeDef)(survey)
  }

module.exports = {
  getNodeDefs,
  getNodeDefsArray,

  // getNodeDefById,
  getRootNodeDef,
  getNodeDefByUuid,
  getNodeDefChildren,
  getNodeDefChildByName,
  getNodeDefSiblingByName,
  getNodeDefKeys,
  getNodeDefByName,

  getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid,

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