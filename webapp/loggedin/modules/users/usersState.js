import * as R from 'ramda'

const keys = {}

export const stateKey = 'users'
const getState = R.prop(stateKey)

const getStateProp = (prop, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, prop))
