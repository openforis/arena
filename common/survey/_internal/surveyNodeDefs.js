const R = require('ramda')

const SurveyCategories = require('./surveyCategories')
const NodeDef = require('./../nodeDef')
const Category = require('../category')
const {toUUIDIndexedObj} = require('./../surveyUtils')

const nodeDefs = 'nodeDefs'

// ====== READ
const getNodeDefs = R.propOr({}, nodeDefs)

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

const getNodeDefKeys = nodeDef => R.pipe(
  getNodeDefChildren(nodeDef),
  R.filter(n => NodeDef.isNodeDefKey(n))
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

const assocNodeDefs = nodeDefsArray => R.assoc(nodeDefs, toUUIDIndexedObj(nodeDefsArray))

// ====== UTILS

const getNodeDefParent = nodeDef => getNodeDefByUuid(NodeDef.getNodeDefParentUuid(nodeDef))

const getNodeDefAncestors = nodeDef =>
  survey => {
    if (NodeDef.isNodeDefRoot(nodeDef)) {
      return []
    } else {
      const parent = getNodeDefParent(nodeDef)(survey)
      return R.append(parent, getNodeDefAncestors(parent)(survey))
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

// ====== NODE DEFS CODE LIST UTILS
const getNodeDefParentCode = nodeDef => getNodeDefByUuid(NodeDef.getNodeDefParentCodeDefUuid(nodeDef))

const isNodeDefParentCode = nodeDef => R.pipe(
  getNodeDefsArray,
  R.any(R.pathEq(['props', 'parentCodeUuid'], nodeDef.uuid)),
)

const getNodeDefCodeCandidateParents = nodeDef =>
  survey => {
    const category = SurveyCategories.getCategoryByUuid(NodeDef.getNodeDefCategoryUuid(nodeDef))(survey)

    if (category) {
      const levelsLength = Category.getLevelsArray(category).length
      const ancestors = getNodeDefAncestors(nodeDef)(survey)

      return R.reduce(
        (acc, ancestor) =>
          R.pipe(
            getNodeDefChildren(ancestor),
            R.reject(n =>
              // reject different code nodeDef
              NodeDef.getNodeDefCategoryUuid(n) !== category.uuid
              ||
              // or itself
              n.uuid === nodeDef.uuid
              ||
              // leaves nodeDef
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
  getNodeDefKeys,

  getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid,

  // ====== UPDATE
  assocNodeDefs,

  // ====== UTILS
  getNodeDefParent,
  getNodeDefAncestors,
  isNodeDefAncestor,

  // ====== NodeDef CodeList
  getNodeDefCategoryLevelIndex,
  getNodeDefParentCode,
  getNodeDefCodeCandidateParents,
  isNodeDefParentCode,
  canUpdateCategory,
}