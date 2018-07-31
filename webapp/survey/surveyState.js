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

export const getEntityDefs = R.pipe(
  R.path(['survey', 'nodeDefs']),
  R.defaultTo({}),
  R.values,
)

export const getEntityDefsByParentId = parentId => R.pipe(
  getEntityDefs,
  R.reduce(
    (entityDefs, entityDef) => entityDef.parentId === parentId
      ? R.append(entityDef, entityDefs)
      : entityDefs,
    []
  )
)

// READ
export const getRootEntityDef = R.pipe(
  getEntityDefsByParentId(null),
  R.head,
)

// UPDATE
export const assocNodeDef = nodeDef => R.assocPath(['nodeDefs', nodeDef.uuid], nodeDef)