import * as R from 'ramda'

export const stateKey = 'data'
export const getState = R.prop(stateKey)
