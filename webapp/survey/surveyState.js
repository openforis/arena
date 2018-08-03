import * as R from 'ramda'

const survey = 'survey'
/**
 * ======================
 * Survey State
 * ======================
 */
export const getSurveyState = R.prop(survey)

// READ
export const getCurrentSurvey = R.path(['app', survey])

export const getCurrentSurveyId = R.pipe(
  getCurrentSurvey,
  R.prop('id'),
)

export const getNewSurvey = R.pipe(
  R.path([survey, 'newSurvey']),
  R.defaultTo({name: '', label: '', lang: 'en', validation: {}})
)

/**
 * ======================
 * Survey-Form State
 * ======================
 */
const surveyFormNodeDefEditPath = ['form', 'nodeDefEdit']
export const assocFormNodeDefEdit = R.pipe(R.assocPath(surveyFormNodeDefEditPath))
export const getFormNodeDefEdit = R.pipe(getSurveyState, R.path(surveyFormNodeDefEditPath))

/**
 * ======================
 * nodeDefs State TODO: Move to common/survey/NodeDef
 * ======================
 */

// ==== READ
const nodeDefs = 'nodeDefs'

export const getNodeDefs = R.pipe(
  R.prop(nodeDefs),
  R.defaultTo({}),
)

export const getNodeDefsArray = R.pipe(
  getNodeDefs,
  R.values,
)

export const getNodeDefsByParentId = parentId => R.pipe(
  getNodeDefsArray,
  R.filter(entityDef => entityDef.parentId === parentId),
)

export const getRootNodeDef = R.pipe(
  getNodeDefsByParentId(null),
  R.head,
)

export const getNodeDefChildren = nodeDef => getNodeDefsByParentId(nodeDef.id)

// ==== UPDATE
export const assocNodeDefs = newNodeDefsArray =>
  survey => R.pipe(
    R.reduce((newNodeDefs, nodeDef) => R.assoc(nodeDef.uuid, nodeDef, newNodeDefs), {}),
    R.mergeDeepRight(getNodeDefs(survey)),
    newNodeDefs => R.assoc(nodeDefs, newNodeDefs, survey)
  )(newNodeDefsArray)

export const assocNodeDef = nodeDef =>
  R.assocPath([nodeDefs, nodeDef.uuid], nodeDef)

export const assocNodeDefProp = (nodeDefUUID, key, value) =>
  R.assocPath([nodeDefs, nodeDefUUID, 'props', key], value)
