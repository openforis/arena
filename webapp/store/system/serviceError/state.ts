import * as A from '@core/arena'
import * as SystemState from '../state'

export const stateKey = 'serviceErrors'

const getState = A.pipe(SystemState.getState, A.propOr({}, stateKey))

// ==== APP ERRORS

const _getServiceErrors = A.pipe(
  A.values,
  A.sort((a, b) => Number(b.id) - Number(a.id))
)

export const getServiceErrors = A.pipe(getState, _getServiceErrors)

export const assocAppError = (error) => (state) =>
  A.pipe(
    _getServiceErrors,
    A.head,
    A.defaultTo({ id: -1 }),
    (last) => 1 + last.id,
    (id) => A.assoc(String(id), { id, ...error })(state)
  )(state)

export const dissocAppError = (error) => A.dissoc(String(error.id))
