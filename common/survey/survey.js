const R = require('ramda')

const {
  getProps,
  getProp,
  getLabels,

  setProp,

  filterMappedObj,
} = require('./surveyUtils')

const {
  isNodeDefRoot,
  isNodeDefEntity,
  getNodeDefCodeListUUID,
  getNodeDefParentCodeUUID,
} = require('./nodeDef')

const {
  getCodeListLevelsLength,
} = require('./codeList')

// == utils
const nodeDefs = 'nodeDefs'
const codeLists = 'codeLists'
const taxonomies = 'taxonomies'

const defaultSteps = {
  '1': {name: 'entry'},
  '2': {name: 'cleansing', prev: '1'},
  '3': {name: 'analysis', prev: '2'},
}

/**
 * ======
 * READ
 * ======
 */
const info = 'info'
const getSurveyInfo = R.propOr(null, info)

const getSurveyId = R.pipe(
  getSurveyInfo,
  R.prop('id')
)

const isValidSurvey = R.pipe(
  getSurveyInfo,
  info => R.isNil(info) || R.isEmpty(info),
  R.not,
)

const getSurveyInfoProp = (prop, defaultValue) => R.pipe(
  getSurveyInfo,
  getProp(prop, defaultValue)
)

const isSurveyPublished = R.pipe(
  getSurveyInfo,
  R.prop('published'),
  R.equals(true)
)

const isSurveyDraft = R.pipe(
  getSurveyInfo,
  R.prop('draft'),
  R.equals(true)
)

const getSurveyLanguages = getSurveyInfoProp('languages', [])

const getSurveyDefaultLanguage = R.pipe(
  getSurveyLanguages,
  R.head,
)

const getSurveyDefaultStep = R.pipe(
  getSurveyInfoProp('steps'),
  R.toPairs,
  R.find(s => !s[1].prev),
  R.head
)

const getSurveyLabels = getSurveyInfoProp('labels', {})

const getSurveyDefaultLabel = survey => {
  const labels = getSurveyLabels(survey)
  const lang = getSurveyDefaultLanguage(survey)
  return R.prop(lang, labels)
}

const getSurveyStatus = survey =>
  isSurveyPublished(survey) && isSurveyDraft(survey)
    ? 'PUBLISHED-DRAFT'
    : isSurveyPublished(survey)
    ? 'PUBLISHED'
    : isSurveyDraft(survey)
      ? 'DRAFT'
      : ''

/**
 * ======
 * UPDATE
 * ======
 */
const assocSurveyProp = (key, value) => R.pipe(
  R.assocPath([info, 'props', key], value),
  R.assocPath([info, 'draft'], true),
)

const assocSurveyPropValidation = (key, validation) =>
  R.assocPath([info, 'validation', 'fields', key], validation)

/**
 * ======
 * READ NodeDefs
 * ======
 */
const getNodeDefs = R.pipe(R.prop(nodeDefs), R.defaultTo({}))

const getNodeDefsArray = R.pipe(getNodeDefs, R.values)

const getNodeDefByUUID = uuid => R.pipe(getNodeDefs, R.propOr(null, uuid))

const getNodeDefById = id => R.pipe(
  getNodeDefsArray,
  R.find(R.propEq('id', id)),
)

const getNodeDefsByParentId = parentId => R.pipe(
  getNodeDefsArray,
  R.filter(R.propEq('parentId', parentId)),
)

const getRootNodeDef = R.pipe(getNodeDefsByParentId(null), R.head)

const getNodeDefChildren = nodeDef => getNodeDefsByParentId(nodeDef.id)

const getNodeDefsByCodeListUUID = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq(['props', 'codeListUUID'], uuid))
)

const getNodeDefsByTaxonomyUUID = (uuid) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq(['props', 'taxonomyUUID'], uuid))
)

/**
 * ======
 * UPDATE NodeDefs
 * ======
 */
const assocNodeDefs = newNodeDefsArray =>
  survey => R.pipe(
    R.reduce((newNodeDefs, nodeDef) => R.assoc(nodeDef.uuid, nodeDef, newNodeDefs), {}),
    R.merge(getNodeDefs(survey)),
    newNodeDefs => R.assoc(nodeDefs, newNodeDefs, survey)
  )(newNodeDefsArray)

const assocNodeDef = nodeDef => R.assocPath([nodeDefs, nodeDef.uuid], nodeDef)

const assocNodeDefProp = (nodeDefUUID, key, value) => R.pipe(
  R.assocPath([nodeDefs, nodeDefUUID, 'props', key], value),
  R.dissocPath([nodeDefs, nodeDefUUID, 'validation', 'fields', key]),
)

/**
 * ======
 * DELETE NodeDef
 * ======
 */
const dissocNodeDef = nodeDef =>
  survey => {
    const updatedSurvey = isNodeDefEntity(nodeDef)
      ? R.reduce(
        (s, n) => dissocNodeDef(n)(s),
        survey,
        getNodeDefChildren(nodeDef)(survey)
      ) : survey

    return R.dissocPath([nodeDefs, nodeDef.uuid])(updatedSurvey)
  }

/**
 * ======
 * READ Code Lists
 * ======
 */
const getCodeLists = R.pipe(
  R.prop(codeLists),
  R.defaultTo({})
)

const getCodeListsArray = R.pipe(
  getCodeLists,
  R.values,
)

const getCodeListByUUID = uuid => R.pipe(
  getCodeLists,
  R.prop(uuid)
)

/**
 * ======
 * UPDATE Code Lists
 * ======
 */
const assocCodeLists = codeLists =>
  survey => R.pipe(
    R.merge(getCodeLists(survey)),
    //exclude null objects
    filterMappedObj(codeList => codeList !== null),
    newCodeLists => R.assoc('codeLists', newCodeLists, survey)
  )(codeLists)

/**
 * ======
 * READ Taxonomies
 * ======
 */
const getSurveyTaxonomies = R.pipe(
  R.prop(taxonomies),
  R.defaultTo({})
)

const getSurveyTaxonomiesArray = R.pipe(
  getSurveyTaxonomies,
  R.values,
)

const getSurveyTaxonomyByUUID = uuid => R.pipe(
  getSurveyTaxonomies,
  R.prop(uuid)
)

/**
 * ======
 * UPDATE Taxonomies
 * ======
 */
const assocSurveyTaxonomies = taxonomies =>
  survey => R.pipe(
    R.merge(getSurveyTaxonomies(survey)),
    filterMappedObj(taxonomy => taxonomy != null),
    newTaxonomies => R.assoc('taxonomies', newTaxonomies, survey)
  )(taxonomies)

/**
 * ======
 * UTILS NodeDefs
 * ======
 */
const getNodeDefParent = nodeDef => getNodeDefById(nodeDef.parentId)

const getNodeDefAncestors = nodeDef =>
  survey => {
    if (isNodeDefRoot(nodeDef)) {
      return []
    } else {
      const parent = getNodeDefParent(nodeDef)(survey)
      return R.append(parent, getNodeDefAncestors(parent)(survey))
    }
  }

const isNodeDefAncestor = (nodeDefAncestor, nodeDefDescendant) =>
  survey => {
    if (isNodeDefRoot(nodeDefDescendant))
      return false

    const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
    return nodeDefParent.id === nodeDefAncestor.id
      ? true
      : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

const getNodeDefCodeParent = nodeDef => getNodeDefByUUID(getNodeDefParentCodeUUID(nodeDef))

const isNodeDefCodeParent = nodeDef => R.pipe(
  getNodeDefsArray,
  R.any(R.pathEq(['props', 'parentCodeUUID'], nodeDef.uuid)),
)

const getNodeDefCodeCandidateParents = nodeDef =>
  survey => {
    const codeList = getCodeListByUUID(getNodeDefCodeListUUID(nodeDef))(survey)

    if (codeList) {
      const codeListLevelsLength = getCodeListLevelsLength(codeList)
      const ancestors = getNodeDefAncestors(nodeDef)(survey)

      return R.reduce(
        (acc, ancestor) =>
          R.pipe(
            getNodeDefChildren(ancestor),
            R.reject(n =>
              // reject different codeList nodeDef
              getNodeDefCodeListUUID(n) !== codeList.uuid
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
    const parentCodeNodeDef = getNodeDefCodeParent(nodeDef)(survey)
    return parentCodeNodeDef
      ? 1 + getNodeDefCodeListLevelIndex(parentCodeNodeDef)(survey)
      : 0
  }

const canUpdateCodeList = nodeDef =>
  survey => {
    return !isNodeDefCodeParent(nodeDef)(survey)
  }

module.exports = {
  defaultSteps,

  // READ
  getSurveyInfo,
  getSurveyProps: getProps,

  getSurveyId,
  isValidSurvey,
  getSurveyName: getSurveyInfoProp('name', ''),
  getSurveyLanguages,
  getSurveyDefaultLanguage,
  getSurveyLabels: getLabels,
  getSurveyDefaultLabel,
  getSurveyDescriptions: getSurveyInfoProp('descriptions', {}),
  getSurveySrs: getSurveyInfoProp('srs', []),
  getSurveyDefaultStep,

  getSurveyStatus,
  isSurveyPublished,
  isSurveyDraft,

  // READ nodeDefs
  getNodeDefs,
  getNodeDefByUUID,
  getNodeDefById,
  getRootNodeDef,
  getNodeDefChildren,
  getNodeDefsByCodeListUUID,
  getNodeDefsByTaxonomyUUID,

  // UPDATE
  assocSurveyProp,
  assocSurveyPropValidation,

  // UPDATE nodeDefs
  assocNodeDefs,
  assocNodeDef,
  assocNodeDefProp,

  // DELETE nodeDefs
  dissocNodeDef,

  // UTILS NodeDefs
  getNodeDefParent,
  isNodeDefAncestor,

  //=======
  // CodeLists
  //=======

  //NodeDef CodeList
  getNodeDefCodeListLevelIndex,
  getNodeDefCodeParent,
  getNodeDefCodeCandidateParents,
  isNodeDefCodeParent,
  canUpdateCodeList,

  // READ codeLists
  getCodeLists,
  getCodeListsArray,
  getCodeListByUUID,

  // UPDATE code lists
  assocCodeLists,

  //=======
  // Taxonomies
  //=======

  //READ taxonomies
  getSurveyTaxonomiesArray,
  getSurveyTaxonomyByUUID,

  //UPDATE taxonomies
  assocSurveyTaxonomies,
}
