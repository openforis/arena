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
export const getSurveyState = R.prop('survey')

export const getNodeDefs = R.pipe(
  getSurveyState,
  R.prop('nodeDefs'),
  R.defaultTo([]),
)

export const getNodeDefsByParentId = parentId => R.pipe(
  getNodeDefs,
  R.reduce(
    (entityDefs, entityDef) => entityDef.parentId === parentId
      ? R.append(entityDef, entityDefs)
      : entityDefs,
    []
  )
)

// READ
export const getRootNodeDef = R.pipe(
  getNodeDefsByParentId(null),
  R.head,
)

// UPDATE
export const assocNodeDef = nodeDef =>
  state => {
    const nodeDefs = R.pipe(
      getNodeDefs,
      R.append(nodeDef)
    )(state)
    return R.assoc('nodeDefs', nodeDefs)(state)
  }