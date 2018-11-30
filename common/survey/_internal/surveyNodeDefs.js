const R = require('ramda')

const SurveyCodeLists = require('./surveyCodeLists')
const NodeDef = require('./../nodeDef')
const CodeList = require('./../codeList')

const nodeDefs = 'nodeDefs'

// ====== READ
const getNodeDefs = R.propOr({}, nodeDefs)

const getNodeDefsArray = R.pipe(getNodeDefs, R.values)

const getNodeDefsByParentUuid = parentUuid => R.pipe(
  getNodeDefsArray,
  R.filter(R.propEq('parentUuid', parentUuid)),
)

const getRootNodeDef = R.pipe(getNodeDefsByParentUuid(null), R.head)

const getNodeDefByUUID = uuid => R.pipe(getNodeDefs, R.propOr(null, uuid))

// const getNodeDefById = id => R.pipe(
//   getNodeDefsArray,
//   R.find(R.propEq('id', id)),
// )

const getNodeDefChildren = nodeDef => getNodeDefsByParentUuid(nodeDef.uuid)

const getNodeDefKeys = nodeDef => R.pipe(
  getNodeDefChildren(nodeDef),
  R.filter(n => NodeDef.isNodeDefKey(n))
)

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

const getNodeDefParent = nodeDef => getNodeDefByUUID(NodeDef.getNodeDefParentUuid(nodeDef))

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
const getNodeDefParentCode = nodeDef => getNodeDefByUUID(NodeDef.getNodeDefParentCodeUUID(nodeDef))

const isNodeDefParentCode = nodeDef => R.pipe(
  getNodeDefsArray,
  R.any(R.pathEq(['props', 'parentCodeUUID'], nodeDef.uuid)),
)

const getNodeDefCodeCandidateParents = nodeDef =>
  survey => {
    const codeList = SurveyCodeLists.getCodeListByUUID(NodeDef.getNodeDefCodeListUUID(nodeDef))(survey)

    if (codeList) {
      const codeListLevelsLength = CodeList.getCodeListLevelsLength(codeList)
      const ancestors = getNodeDefAncestors(nodeDef)(survey)

      return R.reduce(
        (acc, ancestor) =>
          R.pipe(
            getNodeDefChildren(ancestor),
            R.reject(n =>
              // reject different codeList nodeDef
              NodeDef.getNodeDefCodeListUUID(n) !== codeList.uuid
              ||
              // or itself
              n.uuid === nodeDef.uuid
              ||
              // leaves nodeDef
              getNodeDefCodeListLevelIndex(n)(survey) === codeListLevelsLength - 1
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

const getNodeDefCodeListLevelIndex = nodeDef =>
  survey => {
    const parentCodeNodeDef = getNodeDefParentCode(nodeDef)(survey)
    return parentCodeNodeDef
      ? 1 + getNodeDefCodeListLevelIndex(parentCodeNodeDef)(survey)
      : 0
  }

const canUpdateCodeList = nodeDef =>
  survey => {
    return !isNodeDefParentCode(nodeDef)(survey)
  }

module.exports = {
  getNodeDefs,
  getNodeDefsArray,

  // getNodeDefById,
  getRootNodeDef,
  getNodeDefByUUID,
  getNodeDefChildren,
  getNodeDefKeys,

  getNodeDefsByCodeListUUID,
  getNodeDefsByTaxonomyUUID,

  // ====== UPDATE
  assocNodeDefs,

  // ====== UTILS
  getNodeDefParent,
  getNodeDefAncestors,
  isNodeDefAncestor,

  // ====== NodeDef CodeList
  getNodeDefCodeListLevelIndex,
  getNodeDefParentCode,
  getNodeDefCodeCandidateParents,
  isNodeDefParentCode,
  canUpdateCodeList,
}