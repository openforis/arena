import * as R from 'ramda'

import * as AppState from '../appState'

export const stateKey = 'appErrors'

export const keys = {
  errors: 'errors',
}

// ==== APP ERRORS

const _getAppErrors = R.pipe(
  R.prop(keys.errors),
  R.values,
  R.sort((a, b) => +b.id - +a.id)
)

export const getAppErrors = R.pipe(AppState.getState, _getAppErrors)

export const assocAppError = error => state => R.pipe(
  _getAppErrors,
  R.head,
  R.defaultTo({ id: -1 }),
  last => 1 + last.id,
  id => R.assocPath([keys.errors, id + ''], { id, ...error })(state)
)(state)

export const dissocAppError = error => R.dissocPath([keys.errors, error.id + ''])
