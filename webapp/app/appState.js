import * as R from 'ramda'

const app = 'app'
const errors = 'errors'

export const getAppState = R.prop(app)

export const getNewSurvey = R.pipe(
  R.path([app, 'newSurvey']),
  R.defaultTo({name: '', label: '', lang: 'en', validation: {}})
)

export const assocAppError = error => R.assocPath([errors, error.id + ''], error)

export const dissocAppError = error => R.dissocPath([errors, error.id + ''])

export const getAppErrors = R.pipe(
  R.prop(errors),
  R.values,
  R.sort((a, b) => +b.id - +a.id)
)