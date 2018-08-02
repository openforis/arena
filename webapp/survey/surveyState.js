import * as R from 'ramda'

/**
 * ======================
 * survey State
 * ======================
 */

// READ
export const getCurrentSurvey = R.path(['app', 'survey'])

export const getCurrentSurveyId = R.pipe(
  getCurrentSurvey,
  R.prop('id'),
)

export const getNewSurvey = R.pipe(
  R.path(['survey', 'newSurvey']),
  R.defaultTo({name: '', label: '', lang: 'en', validation: {}})
)

/**
 * ======================
 * nodeDefs State
 * ======================
 */

// ==== READ
export const getSurveyState = R.prop('survey')

export const getNodeDefs = R.pipe(
  getSurveyState,
  R.prop('nodeDefs'),
  R.defaultTo({}),
  R.values,
)

export const getNodeDefsByParentId = parentId => R.pipe(
  getNodeDefs,
  R.filter(entityDef => entityDef.parentId === parentId),
)

export const getRootNodeDef = R.pipe(
  getNodeDefsByParentId(null),
  R.head,
)

export const getNodeDefChildren = nodeDef => getNodeDefsByParentId(nodeDef.id)

// ==== UPDATE
export const assocNodeDef = nodeDef => R.assocPath(['nodeDefs', nodeDef.uuid], nodeDef)
