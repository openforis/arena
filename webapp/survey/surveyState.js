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

// READ
export const getRootEntityDef = R.pipe(
  R.path(['survey', 'nodeDefs']),
  R.toPairs,
  R.filter(nodeDef => R.isNil(nodeDef[1].parentId)),
  R.head,
  R.defaultTo([[]]),
  R.tail,
  R.head,
)

// UPDATE
export const assocNodeDef = nodeDef => R.assocPath(['nodeDefs', nodeDef.uuid], nodeDef)