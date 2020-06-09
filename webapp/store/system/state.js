import * as R from 'ramda'

export const stateKey = 'system'

export const getState = R.prop(stateKey)
