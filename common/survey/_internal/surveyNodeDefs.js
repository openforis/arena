const R = require('ramda')
const NodeDef = require('./../nodeDef')

const nodeDefs = 'nodeDefs'

// ====== READ
const getNodeDefs = R.propOr({}, nodeDefs)

const getNodeDefsArray = R.pipe(getNodeDefs, R.values)

const getNodeDefsByParentId = parentId => R.pipe(
  getNodeDefsArray,
  R.filter(R.propEq('parentId', parentId)),
)

const getRootNodeDef = R.pipe(getNodeDefsByParentId(null), R.head)

const getNodeDefByUUID = uuid => R.pipe(getNodeDefs, R.propOr(null, uuid))

const getNodeDefById = id => R.pipe(
  getNodeDefsArray,
  R.find(R.propEq('id', id)),
)

const getNodeDefChildren = nodeDef => getNodeDefsByParentId(nodeDef.id)

const getNodeDefsByCodeListUUID = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq(['props', 'codeListUUID'], uuid))
)

const getNodeDefsByTaxonomyUUID = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq(['props', 'taxonomyUUID'], uuid))
)

// ====== UPDATE

const assocNodeDefs = newNodeDefs => R.assoc(nodeDefs, newNodeDefs)

// ====== UTILS

const getNodeDefParent = nodeDef => getNodeDefById(nodeDef.parentId)

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
    return nodeDefParent.id === nodeDefAncestor.id
      ? true
      : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

module.exports = {
  getNodeDefs,
  getNodeDefsArray,

  getNodeDefById,
  getRootNodeDef,
  getNodeDefByUUID,
  getNodeDefChildren,

  getNodeDefsByCodeListUUID,
  getNodeDefsByTaxonomyUUID,

  // ====== UPDATE
  assocNodeDefs,

  // ====== UTILS
  getNodeDefParent,
  getNodeDefAncestors,
  isNodeDefAncestor,
}