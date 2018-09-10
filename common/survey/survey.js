const R = require('ramda')

const {
  getProps,
  getProp,
  getLabels,

  setProp,
} = require('./surveyUtils')
const {isNodeDefRoot} = require('./nodeDef')

// == utils
const nodeDefs = 'nodeDefs'

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
const isSurveyPublished = R.pipe(
  R.prop('published'),
  R.equals(true)
)

const getSurveyLanguages = getProp('languages', [])

const getSurveyDefaultLanguage = R.pipe(
  getSurveyLanguages,
  R.head,
)

const getSurveyDefaultStep = R.pipe(
  getProp('steps'),
  R.toPairs,
  R.find(s => !s[1].prev),
  R.head
)

/**
 * ======
 * READ NodeDefs
 * ======
 */
const getNodeDefs = R.pipe(R.prop(nodeDefs), R.defaultTo({}))

const getNodeDefsArray = R.pipe(getNodeDefs, R.values)

const getNodeDefByUUID = uuid => R.pipe(getNodeDefs, R.prop(uuid))

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

/**
 * ======
 * UPDATE
 * ======
 */
const assocSurveyPropValidation = (key, validation) =>
  R.assocPath(['validation', 'fields', key], validation)

/**
 * ======
 * UPDATE NodeDefs
 * ======
 */
const assocNodeDefs = newNodeDefsArray =>
  survey => R.pipe(
    R.reduce((newNodeDefs, nodeDef) => R.assoc(nodeDef.uuid, nodeDef, newNodeDefs), {}),
    R.mergeDeepRight(getNodeDefs(survey)),
    newNodeDefs => R.assoc(nodeDefs, newNodeDefs, survey)
  )(newNodeDefsArray)

const assocNodeDef = nodeDef => R.assocPath([nodeDefs, nodeDef.uuid], nodeDef)

const assocNodeDefProp = (nodeDefUUID, key, value) => R.pipe(
  R.assocPath([nodeDefs, nodeDefUUID, 'props', key], value),
  R.dissocPath([nodeDefs, nodeDefUUID, 'validation', 'fields', key]),
)

const assocNodeDefValidation = (nodeDefUUID, validation) =>
  R.assocPath([nodeDefs, nodeDefUUID, 'validation'], validation)

/**
 * ======
 * UTILS NodeDefs
 * ======
 */
const getNodeDefParent = nodeDef => getNodeDefById(nodeDef.parentId)

const isNodeDefAncestor = (nodeDefAncestor, nodeDefDescendant) =>
  survey => {
    if (isNodeDefRoot(nodeDefDescendant))
      return false

    const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
    if (nodeDefParent.id === nodeDefAncestor.id)
      return true
    else
      return isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

module.exports = {
  defaultSteps,

  // READ
  getSurveyProps: getProps,
  getSurveyLabels: getLabels,

  isSurveyPublished,
  getSurveyLanguages,
  getSurveyDefaultLanguage,
  getSurveyDescriptions: getProp('descriptions', {}),
  getSurveySrs: getProp('srs', []),
  getSurveyDefaultStep,

  // READ nodeDefs
  getNodeDefByUUID,
  getRootNodeDef,
  getNodeDefChildren,

  // UPDATE
  assocSurveyProp: setProp,
  assocSurveyPropValidation,

  // UPDATE nodeDefs
  assocNodeDefs,
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefValidation,

  // UTILS
  getSurveyDBSchema: surveyId => `survey_${surveyId}`,
  // UTILS NodeDefs
  getNodeDefParent,
  isNodeDefAncestor,
}
