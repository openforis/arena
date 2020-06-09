import * as R from 'ramda'

export const stateKey = 'ui'

export const getState = R.propOr({}, stateKey)
