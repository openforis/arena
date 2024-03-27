import * as R from 'ramda'

import * as SystemState from '../state'

export const stateKey = 'serviceErrors'

const getState = R.pipe(SystemState.getState, R.propOr({}, stateKey))

// ==== APP ERRORS

const _getServiceErrors = R.pipe(
  R.values,
  R.sort((a, b) => Number(b.id) - Number(a.id))
)

export const getServiceErrors = R.pipe(getState, _getServiceErrors)

export const assocAppError = (error) => (state) =>
  R.pipe(
    _getServiceErrors,
    R.head,
    R.defaultTo({ id: -1 }),
    (last) => 1 + last.id,
    (id) => R.assoc(String(id), { id, ...error })(state)
  )(state)

export const dissocAppError = (error) => R.dissoc(String(error.id))
