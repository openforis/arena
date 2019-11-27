import * as R from 'ramda'

export const stateKey = 'appErrors'

const getState = R.propOr({}, stateKey)

// ==== APP ERRORS

const _getAppErrors = R.pipe(
  R.values,
  R.sort((a, b) => Number(b.id) - Number(a.id))
)

export const getAppErrors = R.pipe(getState, _getAppErrors)

export const assocAppError = error => state => R.pipe(
  _getAppErrors,
  R.head,
  R.defaultTo({id: -1}),
  last => 1 + last.id,
  id => R.assoc(String(id), {id, ...error})(state)
)(state)

export const dissocAppError = error => R.dissoc(String(error.id))
