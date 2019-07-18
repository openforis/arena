import * as R from 'ramda'

export const stateKey = 'login'

const keys = {
  error: 'error'
}
const getState = R.prop(stateKey)

export const assocError = message => R.assoc(keys.error, message)

export const getError = R.pipe(
  getState,
  R.prop(keys.error)
)